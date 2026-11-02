"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { api } from "@/lib/api";
import { formatShortDate } from "@/lib/cover";
import { useAsync } from "@/lib/hooks";
import type { ClaimStatus } from "@/lib/types";

const FILTERS: { id: ClaimStatus | undefined; label: string; className: string }[] = [
  { id: undefined, label: "All", className: "bg-forest text-white" },
  { id: "in_review", label: "In Review", className: "bg-yellow text-ink" },
  { id: "paid", label: "Paid", className: "bg-lime text-ink" },
];

export default function AdminClaimsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<ClaimStatus | undefined>();
  const claims = useAsync(() => api.adminListClaims(filter), [filter]);
  const cols = "grid grid-cols-[1fr_1fr_1fr_0.5fr] items-center";

  return (
    <div className="max-w-[920px]">
      <h1 className="text-[36px] font-semibold tracking-[-0.02em]">Claims</h1>

      <div className="mt-[18px] flex flex-wrap gap-4 lg:gap-[54px]" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`h-[46px] w-[130px] rounded-[4px] text-[18px] font-medium transition-shadow ${f.className} ${
              filter === f.id ? "ring-2 ring-forest ring-offset-2 ring-offset-wash" : "opacity-90 hover:opacity-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-[46px] overflow-x-auto">
        <div className="min-w-[640px]">
          <div className={`${cols} px-[23px] text-[24px] font-semibold tracking-[-0.01em]`}>
            <span>Claim</span>
            <span>Driver</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          <ul className="mt-[14px] flex flex-col gap-[23px]">
            {claims.loading ? <li className="h-[46px] animate-pulse rounded-[4px] bg-mint" /> : null}
            {claims.error ? <li className="rounded-[4px] bg-ink p-3 text-white">{claims.error}</li> : null}
            {claims.data?.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/admin/claims/${c.id}`)}
                  className={`${cols} h-[46px] w-full rounded-[4px] bg-mint px-[23px] text-left text-[18px] font-semibold tracking-[-0.01em] transition-colors hover:bg-leaf/60`}
                >
                  <span>{c.ref}</span>
                  <span>{c.driver_name}</span>
                  <span>
                    <AdminBadge status={c.status} />
                  </span>
                  <span>{formatShortDate(c.created_at)}</span>
                </button>
              </li>
            ))}
            {claims.data?.length === 0 ? (
              <li className="rounded-[4px] bg-mint px-[23px] py-3 text-[16px]">No claims here.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
