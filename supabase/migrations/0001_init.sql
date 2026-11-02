-- RoadPadi — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ───────────────────────────── Profiles ─────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  role text not null default 'driver' check (role in ('driver', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New auth user → profile row (name/phone come from sign-up metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  insert into public.policies (user_id) values (new.id);
  return new;
end;
$$;

-- ───────────────────────────── Policies (cover) ─────────────────────────────
create table public.policies (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  daily_amount integer not null default 300,
  payment_method text not null default 'wallet' check (payment_method in ('bank', 'wallet')),
  payment_time time not null default '06:00',
  cover_expires_at timestamptz,
  activated_at timestamptz
);

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── Inspections ─────────────────────────────
-- Baseline photos + short clip taken before cover starts.
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photos jsonb not null default '{}'::jsonb,
  clip_path text,
  created_at timestamptz not null default now()
);
create index inspections_user_idx on public.inspections (user_id, created_at desc);

-- ───────────────────────────── Payments ─────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  method text not null check (method in ('bank', 'wallet')),
  kind text not null check (kind in ('topup', 'daily')),
  created_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id, created_at desc);

-- ───────────────────────────── Claims ─────────────────────────────
create sequence public.claim_ref_seq start 1001;

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('RP-' || nextval('public.claim_ref_seq')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  incident_date date not null,
  address text not null,
  description text not null default '',
  photos text[] not null default '{}',
  status text not null default 'in_review' check (status in ('in_review', 'paid', 'rejected', 'needs_info')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index claims_user_idx on public.claims (user_id, created_at desc);
create index claims_status_idx on public.claims (status, created_at desc);

-- ───────────────────────────── Row level security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.policies enable row level security;
alter table public.inspections enable row level security;
alter table public.payments enable row level security;
alter table public.claims enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Drivers can only change their name/phone, never their role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "policies: read own or admin" on public.policies
  for select using (user_id = auth.uid() or public.is_admin());
create policy "policies: update own preferences" on public.policies
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Cover dates are only ever moved by the security-definer functions below.
revoke update on public.policies from authenticated;
grant update (payment_method) on public.policies to authenticated;

create policy "inspections: read own or admin" on public.inspections
  for select using (user_id = auth.uid() or public.is_admin());
create policy "inspections: insert own" on public.inspections
  for insert with check (user_id = auth.uid());

create policy "payments: read own or admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());

create policy "claims: read own or admin" on public.claims
  for select using (user_id = auth.uid() or public.is_admin());
-- Claims open once cover is active.
create policy "claims: insert own while covered" on public.claims
  for insert with check (
    user_id = auth.uid()
    and status = 'in_review'
    and admin_note is null
    and exists (
      select 1 from public.policies p
      where p.user_id = auth.uid() and p.cover_expires_at > now()
    )
  );
create policy "claims: admin update" on public.claims
  for update using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────────── Cover functions ─────────────────────────────
-- Next daily debit time (Lagos) after now.
create or replace function public.next_payment_at(p_time time)
returns timestamptz
language sql
stable
as $$
  select case
    when ((now() at time zone 'Africa/Lagos')::date + p_time) at time zone 'Africa/Lagos' > now()
      then ((now() at time zone 'Africa/Lagos')::date + p_time) at time zone 'Africa/Lagos'
    else ((now() at time zone 'Africa/Lagos')::date + 1 + p_time) at time zone 'Africa/Lagos'
  end;
$$;

-- Set up daily payments and start cover. Cover runs until the first debit
-- ("First payment tomorrow at 6:00 AM"), then the daily debit extends it.
create or replace function public.activate_cover(p_method text)
returns public.policies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.policies;
  v_until timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_method not in ('bank', 'wallet') then
    raise exception 'Invalid payment method';
  end if;
  if not exists (select 1 from public.inspections where user_id = auth.uid()) then
    raise exception 'Inspect your car before activating cover';
  end if;

  select * into v_policy from public.policies where user_id = auth.uid() for update;
  v_until := public.next_payment_at(v_policy.payment_time);
  -- Never start with a sliver of cover: if the first debit is <6h away, include the next day.
  if v_until - now() < interval '6 hours' then
    v_until := v_until + interval '1 day';
  end if;

  update public.policies
     set payment_method = p_method,
         activated_at = now(),
         cover_expires_at = greatest(coalesce(cover_expires_at, now()), v_until)
   where user_id = auth.uid()
  returning * into v_policy;
  return v_policy;
end;
$$;

-- One-off ₦300 top up: +24h of cover.
create or replace function public.top_up()
returns public.policies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.policies;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into v_policy from public.policies where user_id = auth.uid() for update;
  if v_policy.activated_at is null then
    raise exception 'Activate cover first';
  end if;

  -- TODO: charge through the payment provider (Paystack/Flutterwave) before extending.
  insert into public.payments (user_id, amount, method, kind)
  values (auth.uid(), v_policy.daily_amount, v_policy.payment_method, 'topup');

  update public.policies
     set cover_expires_at = greatest(coalesce(cover_expires_at, now()), now()) + interval '1 day'
   where user_id = auth.uid()
  returning * into v_policy;
  return v_policy;
end;
$$;

-- Daily debit for every activated policy. Schedule with pg_cron (see cron.sql).
create or replace function public.run_daily_charges()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with charged as (
    update public.policies
       set cover_expires_at = greatest(coalesce(cover_expires_at, now()), now()) + interval '1 day'
     where activated_at is not null
    returning user_id, daily_amount, payment_method
  )
  insert into public.payments (user_id, amount, method, kind)
  select user_id, daily_amount, payment_method, 'daily' from charged;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.run_daily_charges() from public, anon, authenticated;

-- Keep updated_at fresh on claim review
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger claims_touch before update on public.claims
  for each row execute function public.touch_updated_at();

-- ───────────────────────────── Storage ─────────────────────────────
-- Private buckets; files live under "<user id>/…"
insert into storage.buckets (id, name, public)
values ('inspections', 'inspections', false), ('claims', 'claims', false)
on conflict (id) do nothing;

create policy "media: upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('inspections', 'claims')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media: read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('inspections', 'claims')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
