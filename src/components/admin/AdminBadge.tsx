import { claimStatusLabel } from "@/components/ui/StatusBadge";
import type { ClaimStatus } from "@/lib/types";

const badge: Record<ClaimStatus, string> = {
  in_review: "bg-yellow",
  paid: "bg-lime",
  rejected: "bg-ink text-white",
  needs_info: "bg-amber",
};

export function AdminBadge({ status, className = "" }: { status: ClaimStatus; className?: string }) {
  return (
    <span
      className={`inline-flex h-[34px] min-w-[115px] items-center justify-center rounded-[8px] px-3 text-[18px] font-semibold tracking-[-0.01em] ${badge[status]} ${className}`}
    >
      {claimStatusLabel(status)}
    </span>
  );
}
