import Link from "next/link";
import { ClaimBadge } from "@/components/ui/StatusBadge";
import type { Claim } from "@/lib/types";

/** Mint claim card: reference on the left, status on the right. */
export function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <Link
      href={`/claims/${claim.id}`}
      className="flex h-[58px] items-center justify-between rounded-[8px] bg-mint pr-[19px] pl-[15px] transition-colors hover:bg-leaf/50"
    >
      <span className="text-[16px] font-semibold tracking-[-0.01em]">{claim.ref}</span>
      <ClaimBadge status={claim.status} />
    </Link>
  );
}

export function ClaimRowSkeleton() {
  return <div className="h-[58px] animate-pulse rounded-[8px] bg-mint/70" />;
}
