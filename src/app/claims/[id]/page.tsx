"use client";

import { use } from "react";
import { Calendar, Check, MapPin } from "lucide-react";
import { FlowScreen } from "@/components/ui/FlowScreen";
import { Thumb } from "@/components/ui/PhotoTile";
import { ClaimBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { formatLongDate, formatShortDate } from "@/lib/cover";
import { useAsync, useMediaUrls } from "@/lib/hooks";
import type { ClaimStatus } from "@/lib/types";

const steps = ["Submitted", "In review", "Decision"];

function stepIndex(status: ClaimStatus) {
  if (status === "in_review" || status === "needs_info") return 1;
  return 2;
}

/** Track Claim — status timeline + what was submitted. */
export default function ClaimPage({ params }: PageProps<"/claims/[id]">) {
  const { id } = use(params);
  const { data: claim, loading, error } = useAsync(() => api.getClaim(id), [id]);
  const photos = useMediaUrls("claims", claim?.photos);

  return (
    <FlowScreen title={claim?.ref ?? "Claim"} back="/claims" right={claim ? <ClaimBadge status={claim.status} /> : null}>
      {loading ? <div className="mt-8 h-40 animate-pulse rounded-card bg-mint" /> : null}
      {error ? <p className="mt-8 rounded-[8px] bg-ink p-4 text-white">{error}</p> : null}
      {!loading && !claim && !error ? <p className="mt-8">We couldn&apos;t find that claim.</p> : null}

      {claim ? (
        <div className="animate-fade-up pb-16">
          <ol className="mt-[30px] flex items-start justify-between" aria-label="Claim progress">
            {steps.map((label, i) => {
              const done = i <= stepIndex(claim.status);
              const text =
                i === 2 && claim.status === "paid"
                  ? "Paid"
                  : i === 2 && claim.status === "rejected"
                    ? "Rejected"
                    : label;
              return (
                <li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                  {i > 0 ? (
                    <span
                      className={`absolute top-[13px] right-1/2 h-[3px] w-full ${done ? "bg-green" : "bg-mint"}`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-10 grid size-7 place-items-center rounded-full ${
                      done ? (claim.status === "rejected" && i === 2 ? "bg-ink text-white" : "bg-lime") : "bg-mint"
                    }`}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  <span className={`text-[12px] font-semibold ${done ? "text-ink" : "text-ink/50"}`}>{text}</span>
                </li>
              );
            })}
          </ol>

          {claim.status === "needs_info" && claim.admin_note ? (
            <div className="mt-6 rounded-card bg-butter p-4">
              <p className="text-[14px] font-semibold">We need a bit more information</p>
              <p className="mt-1 text-[14px]">{claim.admin_note}</p>
            </div>
          ) : null}
          {claim.status === "in_review" ? (
            <p className="mt-6 rounded-card bg-mint px-4 py-3 text-[14px] font-medium">
              Submitted {formatShortDate(claim.created_at)}. We&apos;ll update you within 24 hours.
            </p>
          ) : null}

          <h2 className="mt-8 mb-3 text-[16px] font-semibold">What you sent</h2>
          {claim.photos.length ? (
            <div className="grid grid-cols-3 gap-2">
              {claim.photos.map((_, i) => (
                <Thumb key={i} src={photos[i]} alt={`Accident photo ${i + 1}`} />
              ))}
            </div>
          ) : null}
          <div className="mt-[13px] flex h-9 items-center gap-[10px] rounded-[8px] bg-mint px-[17px] text-[16px] font-medium">
            <Calendar className="size-5" strokeWidth={1.5} aria-hidden /> {formatLongDate(claim.incident_date)}
          </div>
          <div className="mt-[13px] flex min-h-10 items-center gap-[10px] rounded-[8px] bg-mint px-[17px] py-2 text-[16px] font-medium">
            <MapPin className="size-[22px] shrink-0" strokeWidth={2} aria-hidden /> {claim.address}
          </div>
          {claim.description ? (
            <p className="mt-[13px] rounded-card bg-mint px-5 py-5 text-[14px] whitespace-pre-wrap">{claim.description}</p>
          ) : null}
        </div>
      ) : null}
    </FlowScreen>
  );
}
