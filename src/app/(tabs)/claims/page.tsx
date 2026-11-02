"use client";

import { ClaimRow, ClaimRowSkeleton } from "@/components/claims/ClaimRow";
import { LinkButton } from "@/components/ui/Button";
import { PageTitle, TopBar } from "@/components/ui/TopBar";
import { api } from "@/lib/api";
import { formatShortDate } from "@/lib/cover";
import { useAsync } from "@/lib/hooks";

export default function ClaimsPage() {
  const claims = useAsync(() => api.listMyClaims());

  return (
    <>
      <TopBar />
      <PageTitle>Claims</PageTitle>

      <LinkButton href="/claims/new" variant="primary" className="mt-[34px]">
        Report an accident
      </LinkButton>

      <section className="mt-10">
        <h2 className="mb-[10px] text-[16px] font-semibold">All claims</h2>
        {claims.error ? <p className="rounded-[8px] bg-ink p-4 text-white">{claims.error}</p> : null}
        <ul className="flex flex-col gap-4">
          {claims.loading ? (
            <ClaimRowSkeleton />
          ) : claims.data?.length ? (
            claims.data.map((c) => (
              <li key={c.id}>
                <ClaimRow claim={c} />
                <p className="mt-[6px] pl-[15px] text-[12px] font-medium text-ink/70">
                  {formatShortDate(c.created_at)} · {c.address}
                </p>
              </li>
            ))
          ) : (
            <li className="rounded-[8px] bg-mint px-4 py-4 text-[14px] text-ink/75">
              No claims yet. If you have an accident, report it here.
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
