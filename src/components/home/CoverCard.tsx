import { ShieldIcon } from "@/components/ui/ShieldIcon";
import { DAY_MS, DAILY_AMOUNT, formatPaymentTime, formatRemaining, naira, type CoverState } from "@/lib/cover";

type Props = {
  state: CoverState;
  remainingMs: number;
  amount: number;
  paymentTime: string;
};

const pill = "inline-flex h-12 items-center gap-[14px] rounded-[8px] px-[18px] text-[20px] font-semibold tracking-[-0.01em]";

function Bar({ value, track, fill }: { value: number; track: string; fill: string }) {
  return (
    <div className={`h-[6px] w-full overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full ${fill} transition-[width] duration-700`} style={{ width: `${Math.min(1, value) * 100}%` }} />
    </div>
  );
}

/** The hero card on Home — three designed states: covered, ending soon, not covered. */
export function CoverCard({ state, remainingMs, amount, paymentTime }: Props) {
  const share = remainingMs / DAY_MS;

  if (state === "none") {
    return (
      <section className="animate-fade-up rounded-card bg-stone px-5 pt-[14px] pb-[22px]" aria-label="Cover status">
        <div className="flex items-start justify-between">
          <span className={`${pill} bg-ink text-white`}>
            <ShieldIcon variant="slash" className="size-[30px]" />
            Not covered
          </span>
          <span className="pt-[13px] text-[16px] font-semibold">Today</span>
        </div>
        <p className="mt-[27px] text-[22px] font-semibold tracking-[-0.02em]">You&apos;re driving unprotected</p>
        <div className="mt-[6px]">
          <Bar value={1} track="bg-slate" fill="bg-slate" />
        </div>
        <p className="mt-[14px] text-[16px] font-medium">Activate cover from {naira(DAILY_AMOUNT)} a day</p>
      </section>
    );
  }

  const ending = state === "ending";
  return (
    <section
      className={`animate-fade-up rounded-card px-5 pt-[14px] pb-[30px] ${ending ? "bg-butter text-ink" : "bg-green text-white"}`}
      aria-label="Cover status"
    >
      <div className="flex items-start justify-between">
        <span className={`${pill} text-ink ${ending ? "bg-amber px-[38px]" : "bg-neon"}`}>
          {ending ? null : <ShieldIcon className="size-[26px] text-mint" />}
          {ending ? "Ending soon" : "Covered"}
        </span>
        <span className={`pt-[13px] text-[16px] font-semibold ${ending ? "text-ink" : "text-white"}`}>Today</span>
      </div>

      <p className="mt-[26px] text-[44px] leading-none font-medium tracking-[-0.02em]" aria-live="polite">
        {formatRemaining(remainingMs)}
      </p>
      <p className="mt-[12px] text-[18px] font-medium">of cover left</p>

      <div className="mt-[22px]">
        {ending ? (
          <Bar value={share} track="bg-butter-deep" fill="bg-amber" />
        ) : (
          <Bar value={share} track="bg-mint" fill="bg-leaf" />
        )}
      </div>

      {ending ? (
        <p className="mt-[18px] text-[18px] font-medium">Top up to stay covered</p>
      ) : (
        <p className="mt-[14px] text-[18px] leading-[1.2] font-semibold">
          Next payment:
          <br />
          {naira(amount)} at {formatPaymentTime(paymentTime)}
        </p>
      )}
    </section>
  );
}
