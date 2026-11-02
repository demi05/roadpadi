"use client";

import { useState } from "react";
import { Landmark, Wallet } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { FlowScreen } from "@/components/ui/FlowScreen";
import { SuccessScreen } from "@/components/ui/SuccessScreen";
import { api } from "@/lib/api";
import { DAILY_AMOUNT, formatPaymentTime, naira } from "@/lib/cover";
import { useMe } from "@/lib/hooks";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string; Icon: typeof Wallet }[] = [
  { id: "bank", label: "Bank Account", Icon: Landmark },
  { id: "wallet", label: "Mobile Wallet", Icon: Wallet },
];

/** Payment Method → Confirm Payment → Payment set up */
export default function ActivatePage() {
  const me = useMe();
  const [stage, setStage] = useState<"method" | "confirm" | "done">("method");
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = me.data?.policy?.daily_amount ?? DAILY_AMOUNT;
  const time = me.data?.policy?.payment_time ?? "06:00";

  if (stage === "done") {
    return (
      <SuccessScreen
        title="Payment set up"
        message={`First payment tomorrow at ${formatPaymentTime(time)}`}
        action={
          <LinkButton href="/home" variant="cta" size="lg">
            Go to Home
          </LinkButton>
        }
      />
    );
  }

  if (stage === "confirm") {
    return (
      <FlowScreen
        title="Confirm Payment"
        back={() => setStage("method")}
        footer={
          <>
            {error ? (
              <p role="alert" className="mb-3 rounded-[8px] bg-ink px-4 py-3 text-[14px] text-white">
                {error}
              </p>
            ) : null}
            <div className="px-[9px]">
              <Button
                variant="cta"
                size="lg"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await api.activateCover(method);
                    setStage("done");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not set up payment");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </>
        }
      >
        <div className="animate-fade-up mt-[20px] flex flex-col gap-5">
          <div className="rounded-[8px] bg-forest px-5 pt-[20px] pb-[16px] text-white">
            <p className="text-[14px] font-medium">Daily Cover</p>
            <p className="mt-[6px] text-[26px] font-semibold">{naira(amount)}</p>
          </div>
          <div className="mx-[3px] mt-5 flex h-10 items-center justify-between rounded-[8px] bg-mint px-[18px] text-[16px] font-semibold">
            <span>From</span>
            <span>{method === "wallet" ? "Wallet" : "Bank"}</span>
          </div>
          <div className="mx-[3px] -mt-1 flex h-10 items-center justify-between rounded-[8px] bg-mint px-[18px] text-[16px] font-semibold">
            <span>Time</span>
            <span>{formatPaymentTime(time, true)}</span>
          </div>
        </div>
      </FlowScreen>
    );
  }

  return (
    <FlowScreen
      title="Payment Method"
      back="/home"
      footer={
        <Button variant="cta" size="lg" onClick={() => setStage("confirm")}>
          Continue
        </Button>
      }
    >
      <div className="animate-fade-up">
        <div className="mt-[20px] grid grid-cols-2 gap-[13px]" role="radiogroup" aria-label="Payment method">
          {METHODS.map(({ id, label, Icon }) => {
            const selected = method === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMethod(id)}
                className={`flex h-[87px] flex-col items-center justify-center gap-[6px] rounded-card border border-forest text-[16px] text-forest transition-colors ${
                  selected ? "bg-mint" : "bg-white hover:bg-mint/40"
                }`}
              >
                <Icon className="size-[24px]" strokeWidth={1.4} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-[31px] flex h-[38px] items-center rounded-[8px] bg-mint px-5 text-[12px] font-semibold">
          Pay daily from the account you chose
        </p>
      </div>
    </FlowScreen>
  );
}
