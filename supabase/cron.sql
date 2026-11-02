-- Optional: run the ₦300 daily debit every morning at 6:00 AM Lagos (05:00 UTC).
-- Enable the pg_cron extension first: Dashboard → Database → Extensions → pg_cron.
select cron.schedule('roadpadi-daily-charges', '0 5 * * *', $$select public.run_daily_charges();$$);

-- To stop it:
-- select cron.unschedule('roadpadi-daily-charges');
