"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Toast } from "@/components/ui/Toast";
import { PageTitle, TopBar } from "@/components/ui/TopBar";
import { api } from "@/lib/api";
import { resetDemo, setDemoCover } from "@/lib/api/demo";
import { IS_DEMO } from "@/lib/config";
import { formatPaymentTime, formatShortDate, naira, type CoverState } from "@/lib/cover";
import { useAsync, useMe } from "@/lib/hooks";
import type { PaymentMethod } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const me = useMe();
  const payments = useAsync(() => api.listPayments());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const profile = me.data?.profile;
  const policy = me.data?.policy;
  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.updateProfile({ full_name: String(f.get("full_name")).trim(), phone: String(f.get("phone")).trim() });
      me.reload();
      setToast("Profile saved");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function changeMethod(m: PaymentMethod) {
    await api.setPaymentMethod(m);
    me.reload();
    setToast(`Daily payment now from your ${m === "wallet" ? "mobile wallet" : "bank account"}`);
  }

  function demo(state: CoverState) {
    setDemoCover(state);
    router.push("/home");
  }

  return (
    <>
      <TopBar />
      <PageTitle>Profile</PageTitle>

      {me.loading ? <div className="mt-8 h-64 animate-pulse rounded-card bg-mint" /> : null}

      {profile ? (
        <div className="animate-fade-up">
          <div className="mt-[34px] flex items-center gap-4">
            <span className="grid size-[56px] place-items-center rounded-full bg-sprout font-display text-[18px] text-forest">
              {initials}
            </span>
            <div className="rounded-[6px] bg-white/80 pr-2">
              <p className="text-[18px] font-semibold">{profile.full_name || "Driver"}</p>
              <p className="text-[14px] text-ink/70">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={save} className="mt-8 flex flex-col gap-4 rounded-card bg-white/90 p-4 shadow-[0_0_0_1px_var(--color-mint)]">
            <TextField label="Full name" name="full_name" defaultValue={profile.full_name} required />
            <TextField label="Phone number" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
            <Button type="submit" variant="primary" loading={saving}>
              Save
            </Button>
          </form>

          <section className="mt-8 rounded-card bg-white/90 p-4 shadow-[0_0_0_1px_var(--color-mint)]">
            <h2 className="text-[16px] font-semibold">Daily payment</h2>
            <p className="mt-1 text-[14px] text-ink/75">
              {naira(policy?.daily_amount ?? 300)} every day at {formatPaymentTime(policy?.payment_time ?? "06:00")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-[13px]" role="radiogroup" aria-label="Payment method">
              {(
                [
                  ["bank", "Bank Account", Landmark],
                  ["wallet", "Mobile Wallet", Wallet],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={policy?.payment_method === id}
                  onClick={() => changeMethod(id)}
                  className={`flex h-[72px] flex-col items-center justify-center gap-1 rounded-card border border-forest text-[14px] text-forest ${
                    policy?.payment_method === id ? "bg-mint" : "bg-white"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.4} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-[10px] text-[16px] font-semibold">Payment history</h2>
            <ul className="flex flex-col gap-2">
              {(payments.data ?? []).slice(0, 6).map((p) => (
                <li key={p.id} className="flex h-11 items-center justify-between rounded-[8px] bg-mint px-4 text-[14px] font-semibold">
                  <span>{p.kind === "topup" ? "Top up" : "Daily cover"}</span>
                  <span className="text-ink/70">{formatShortDate(p.created_at)}</span>
                  <span>{naira(p.amount)}</span>
                </li>
              ))}
              {payments.data?.length === 0 ? (
                <li className="rounded-[8px] bg-mint px-4 py-3 text-[14px] text-ink/70">No payments yet.</li>
              ) : null}
            </ul>
          </section>

          {profile.role === "admin" ? (
            <Link
              href="/admin/claims"
              className="mt-8 flex h-12 items-center justify-between rounded-btn bg-forest px-4 text-[16px] font-semibold text-white"
            >
              Open admin dashboard <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : null}

          {IS_DEMO ? (
            <section className="mt-8 rounded-card border border-dashed border-green bg-white/90 p-4">
              <h2 className="text-[14px] font-semibold">Demo controls</h2>
              <p className="mt-1 text-[12px] text-ink/70">Jump Home between the three designed states.</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] font-semibold">
                <button className="h-9 rounded-[6px] bg-leaf" onClick={() => demo("covered")}>
                  Covered
                </button>
                <button className="h-9 rounded-[6px] bg-amber" onClick={() => demo("ending")}>
                  Ending soon
                </button>
                <button className="h-9 rounded-[6px] bg-ink text-white" onClick={() => demo("none")}>
                  Not covered
                </button>
              </div>
              <button
                className="mt-3 text-[12px] font-semibold text-green underline underline-offset-2"
                onClick={() => {
                  resetDemo();
                  router.push("/home");
                }}
              >
                Reset demo data
              </button>
            </section>
          ) : null}

          <Button
            variant="secondary"
            className="mt-8"
            onClick={async () => {
              await api.signOut();
              router.replace("/login");
              router.refresh();
            }}
          >
            Sign out
          </Button>
        </div>
      ) : null}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
