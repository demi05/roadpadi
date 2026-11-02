import type { CoverState } from "@/lib/cover";
import type { ClaimStatus } from "@/lib/types";

/* Style guide "Status Button" colours */
const claimStyles: Record<ClaimStatus, { label: string; className: string }> = {
  in_review: { label: "In review", className: "bg-yellow text-ink" },
  paid: { label: "Paid", className: "bg-lime text-ink" },
  rejected: { label: "Rejected", className: "bg-ink text-white" },
  needs_info: { label: "Needs info", className: "bg-amber text-ink" },
};

export const claimStatusLabel = (s: ClaimStatus) => claimStyles[s].label;

export function ClaimBadge({ status, className = "" }: { status: ClaimStatus; className?: string }) {
  const s = claimStyles[status];
  return (
    <span
      className={`inline-flex h-[30px] min-w-[123px] items-center justify-center rounded-[6px] px-3 text-[16px] font-semibold ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}

const coverStyles: Record<CoverState, { label: string; className: string }> = {
  covered: { label: "Covered", className: "bg-leaf text-ink" },
  ending: { label: "Ending soon", className: "bg-amber text-ink" },
  none: { label: "Not Covered", className: "bg-ink text-white" },
};

export function CoverBadge({ state, className = "" }: { state: CoverState; className?: string }) {
  const s = coverStyles[state];
  return (
    <span
      className={`inline-flex h-[30px] items-center justify-center rounded-[6px] px-3 text-[14px] font-semibold ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}
