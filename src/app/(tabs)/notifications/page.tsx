"use client";

import Link from "next/link";
import { FileText, Wallet } from "lucide-react";
import { claimStatusLabel } from "@/components/ui/StatusBadge";
import { PageTitle, TopBar } from "@/components/ui/TopBar";
import { api } from "@/lib/api";
import { formatShortDate, naira } from "@/lib/cover";
import { useAsync } from "@/lib/hooks";

type Item = { id: string; at: string; title: string; body: string; href?: string; kind: "claim" | "payment" };

/** Activity feed built from the driver's claims and payments. */
export default function NotificationsPage() {
  const feed = useAsync(async () => {
    const [claims, payments] = await Promise.all([api.listMyClaims(), api.listPayments()]);
    const items: Item[] = [
      ...claims.map((c) => ({
        id: c.id,
        at: c.created_at,
        title: `${c.ref} · ${claimStatusLabel(c.status)}`,
        body:
          c.status === "paid"
            ? "Your claim has been paid."
            : c.status === "needs_info"
              ? c.admin_note || "We need more information about this claim."
              : c.status === "rejected"
                ? "This claim was not approved."
                : "We're reviewing your claim. We'll update you within 24 hours.",
        href: `/claims/${c.id}`,
        kind: "claim" as const,
      })),
      ...payments.map((p) => ({
        id: p.id,
        at: p.created_at,
        title: `${naira(p.amount)} ${p.kind === "topup" ? "top up" : "daily payment"}`,
        body: "24 hours of cover added.",
        kind: "payment" as const,
      })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at));
  });

  return (
    <>
      <TopBar />
      <PageTitle>Updates</PageTitle>
      <ul className="mt-[34px] flex flex-col gap-3">
        {feed.loading ? <li className="h-[72px] animate-pulse rounded-card bg-mint" /> : null}
        {feed.data?.map((n) => {
          const Icon = n.kind === "claim" ? FileText : Wallet;
          const inner = (
            <div className="flex gap-3 rounded-card bg-mint p-4">
              <Icon className="mt-[2px] size-5 shrink-0 text-forest" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[16px] font-semibold">{n.title}</p>
                  <span className="shrink-0 text-[12px] text-ink/60">{formatShortDate(n.at)}</span>
                </div>
                <p className="mt-1 text-[14px] text-ink/80">{n.body}</p>
              </div>
            </div>
          );
          return <li key={n.id}>{n.href ? <Link href={n.href}>{inner}</Link> : inner}</li>;
        })}
        {feed.data?.length === 0 ? (
          <li className="rounded-card bg-mint p-4 text-[14px] text-ink/70">Nothing new yet.</li>
        ) : null}
      </ul>
    </>
  );
}
