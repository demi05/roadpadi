-- Promote an account to admin (gives access to /admin).
-- Replace the email, then run in the Supabase SQL editor.
update public.profiles set role = 'admin' where email = 'you@example.com';
