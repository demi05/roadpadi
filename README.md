# RoadPadi

Pay-as-you-go micro-insurance for drivers. Daily ₦300 cover for accidents and repairs, matched to how drivers actually earn.

Built with Next.js 16 (App Router), Tailwind CSS v4 and Supabase (auth, Postgres, storage).

## Screens

| Route | Screen |
| --- | --- |
| `/` | Splash |
| `/login` | Sign in / create account |
| `/home` | Home: Covered, Ending soon, Not covered |
| `/claims/new` | Report an accident: Add photos, What happened, Review, Claim submitted |
| `/claims/[id]` | Track claim |
| `/claims` | All claims |
| `/inspection` | Inspection: 5 photos (front, rear, left, right, dashboard), short clip, review |
| `/activate` | Payment method, Confirm payment, Payment set up |
| `/profile` | Profile, daily payment method, payment history |
| `/notifications` | Claim and payment updates |
| `/admin/claims` | Admin: claims table with filters |
| `/admin/claims/[id]` | Admin: baseline vs crash photos, Approve / Reject / Ask for more info |
| `/admin/drivers` | Admin: drivers and their cover |

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys the app runs in **demo mode**: no sign-in, seeded data stored in your browser, and demo controls on the Profile page to switch Home between its three states. Good for design reviews and demo day.

## Connect Supabase

1. Create a project at https://supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. It creates the tables, row-level security, cover functions and the private `inspections` and `claims` storage buckets.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key.
4. For quick testing, turn off **Authentication → Providers → Email → Confirm email**, or leave it on to make users confirm their email.
5. Sign up in the app, then run `supabase/make-admin.sql` with your email to unlock `/admin`.
6. Optional: enable the `pg_cron` extension and run `supabase/cron.sql` to charge the daily ₦300 at 6:00 AM Lagos time.

### How cover works

- `activate_cover(method)`: needs a baseline inspection. Cover starts now and runs until the first daily debit ("First payment tomorrow at 6:00 AM").
- `top_up()`: records a ₦300 payment and adds 24 hours.
- `run_daily_charges()`: the 6:00 AM debit. It records a payment and adds 24 hours for every activated policy.
- Drivers can only file claims while covered. This is enforced by RLS, not just the UI.
- Cover dates can only be changed through these functions. Drivers cannot edit them directly.

> Payments are simulated. Plug Paystack/Flutterwave into `top_up` and `run_daily_charges` (see the TODO in the migration) before going live.

## Design tokens

Colours, type and spacing come from the RoadPadi brand identity and style guide and live in `src/app/globals.css`. Krona One is the display face and Archivo is the UI face. Both are self-hosted through Fontsource.
