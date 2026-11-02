export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * With no Supabase keys the app runs in demo mode: no sign-in, data lives in
 * the browser (localStorage). Handy for design reviews and the demo day.
 */
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_KEY || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
