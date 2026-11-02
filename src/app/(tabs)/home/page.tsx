"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ClaimRow, ClaimRowSkeleton } from "@/components/claims/ClaimRow";
import { CoverCard } from "@/components/home/CoverCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { PageTitle, TopBar } from "@/components/ui/TopBar";
import { api } from "@/lib/api";
import { coverRemainingMs, coverState, DAILY_AMOUNT, naira } from "@/lib/cover";
import { useAsync, useMe, useNow } from "@/lib/hooks";

export default function HomePage() {
  const me = useMe();
  const claims = useAsync(() => api.listMyClaims());
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "error" } | null>(null);

  const policy = me.data?.policy ?? null;
  const loading = me.loading || now === 0;
  const state = coverState(policy, now);
  const remaining = coverRemainingMs(policy, now);
  const firstName = me.data?.profile.full_name.split(" ")[0] || "there";
  const activateHref = me.data?.inspection ? "/activate" : "/inspection";
  const latest = (claims.data ?? []).slice(0, 2);

  async function topUp() {
    setBusy(true);
    try {
      await api.topUp();
      me.reload();
      setToast({ msg: `${naira(policy?.daily_amount ?? DAILY_AMOUNT)} paid — 24 hours added`, tone: "ok" });
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : "Top up failed", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar />
      <PageTitle>Hi, {me.loading ? "…" : firstName}</PageTitle>

      <div className="mt-[44px]">
        {loading ? (
          <div className="h-[276px] animate-pulse rounded-card bg-mint" />
        ) : me.error ? (
          <p className="rounded-card bg-ink p-5 text-white">{me.error}</p>
        ) : (
          <CoverCard
            state={state}
            remainingMs={remaining}
            amount={policy?.daily_amount ?? DAILY_AMOUNT}
            paymentTime={policy?.payment_time ?? "06:00"}
          />
        )}
      </div>

      {!loading && !me.error ? (
        <div className="mt-10 flex flex-col gap-[26px]">
          {state === "covered" ? (
            <LinkButton href="/claims/new" variant="primary">
              Report an accident
            </LinkButton>
          ) : null}
          {state === "ending" ? (
            <>
              <Button variant="alternate" onClick={topUp} loading={busy}>
                Top up {naira(policy?.daily_amount ?? DAILY_AMOUNT)}
              </Button>
              <LinkButton href="/claims/new" variant="secondary">
                Report an accident
              </LinkButton>
            </>
          ) : null}
          {state === "none" ? (
            <div>
              <LinkButton href={activateHref} variant="alternate">
                Activate cover
              </LinkButton>
              <p className="mt-[30px] flex items-center gap-1 text-[12px] font-medium">
                <Info className="size-3" strokeWidth={2.25} aria-hidden /> Claims open once cover is active
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-[10px] text-[16px] font-semibold">Latest claim</h2>
        <div className="flex flex-col gap-4">
          {claims.loading ? (
            <ClaimRowSkeleton />
          ) : latest.length ? (
            latest.map((c) => <ClaimRow key={c.id} claim={c} />)
          ) : (
            <p className="rounded-[8px] bg-mint px-4 py-4 text-[14px] text-ink/75">No claims yet. Drive safe!</p>
          )}
        </div>
      </section>

      <Toast message={toast?.msg ?? null} tone={toast?.tone} onDone={() => setToast(null)} />
    </>
  );
}
