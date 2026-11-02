import type { Policy } from "./types";

export const DAILY_AMOUNT = 300;
export const DAY_MS = 24 * 60 * 60 * 1000;
/** Below this much cover left, home switches to the "Ending soon" state. */
export const ENDING_SOON_MS = 3 * 60 * 60 * 1000;
/** Nigeria is UTC+1 all year (no DST). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type CoverState = "covered" | "ending" | "none";

export function coverRemainingMs(policy: Policy | null, now = Date.now()) {
  if (!policy?.cover_expires_at) return 0;
  return Math.max(0, new Date(policy.cover_expires_at).getTime() - now);
}

export function coverState(policy: Policy | null, now = Date.now()): CoverState {
  const left = coverRemainingMs(policy, now);
  if (left <= 0) return "none";
  if (left <= ENDING_SOON_MS) return "ending";
  return "covered";
}

/** 18h 24m */
export function formatRemaining(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

/** "06:00" → "6:00 AM" */
export function formatPaymentTime(hhmm: string, compact = false) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  const t = `${hour}:${String(m).padStart(2, "0")}`;
  return compact ? `${t}${suffix.toLowerCase()}` : `${t} ${suffix}`;
}

export function naira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** Next occurrence of the daily debit time (Lagos), as a Date. */
export function nextPaymentAt(hhmm = "06:00", now = Date.now()) {
  const [h, m] = hhmm.split(":").map(Number);
  const lagosNow = new Date(now + LAGOS_OFFSET_MS);
  const target = Date.UTC(
    lagosNow.getUTCFullYear(),
    lagosNow.getUTCMonth(),
    lagosNow.getUTCDate(),
    h,
    m,
  ) - LAGOS_OFFSET_MS;
  return new Date(target > now ? target : target + DAY_MS);
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "Africa/Lagos" });
  return `${d.toLocaleString("en-GB", { day: "numeric", timeZone: "Africa/Lagos" })} ${month === "Sep" ? "Sept" : month}`;
}

export function formatLongDate(isoDate: string) {
  // incident dates are plain YYYY-MM-DD
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function todayLagos() {
  return new Date(Date.now() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}
