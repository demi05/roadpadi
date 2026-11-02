"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { api } from "@/lib/api";
import { formatLongDate } from "@/lib/cover";
import { useAsync, useMediaUrls } from "@/lib/hooks";
import { INSPECTION_SIDES, type ClaimStatus } from "@/lib/types";

function PhotoBox({ src, tone, alt }: { src?: string; tone: "green" | "yellow"; alt: string }) {
  const frame = tone === "green" ? "dashed-tile bg-mint text-forest" : "dashed-tile-yellow bg-butter-deep text-[#6b5e00]";
  const body = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
    <img src={src} alt={alt} className="size-full object-cover" />
  ) : (
    <ImageIcon className="size-[24px]" strokeWidth={1.75} aria-label={alt} />
  );
  return (
    <div className={`grid h-[115px] w-[183px] shrink-0 place-items-center overflow-hidden rounded-card ${frame}`}>
      {src ? (
        <a href={src} target="_blank" rel="noreferrer" className="size-full">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

export default function AdminClaimPage({ params }: PageProps<"/admin/claims/[id]">) {
  const { id } = use(params);
  const res = useAsync(() => api.adminGetClaim(id), [id]);
  const claim = res.data?.claim;
  const inspection = res.data?.inspection;
  const baselinePaths = INSPECTION_SIDES.map((s) => inspection?.photos[s]).filter((p): p is string => !!p);
  const baseline = useMediaUrls("inspections", baselinePaths);
  const crash = useMediaUrls("claims", claim?.photos);
  const [busy, setBusy] = useState<ClaimStatus | null>(null);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");

  async function review(status: ClaimStatus, n?: string) {
    setBusy(status);
    try {
      await api.adminReviewClaim(id, status, n);
      setAsking(false);
      res.reload();
    } finally {
      setBusy(null);
    }
  }

  if (res.loading) return <div className="h-40 max-w-[896px] animate-pulse rounded-card bg-mint" />;
  if (res.error) return <p className="rounded-[4px] bg-ink p-4 text-white">{res.error}</p>;
  if (!claim) return <p>Claim not found.</p>;

  const baselineSlots = baselinePaths.length ? baselinePaths : [null, null];
  const crashSlots = claim.photos.length ? claim.photos : [null, null];
  const decided = claim.status === "paid" || claim.status === "rejected";

  return (
    <div className="max-w-[920px]">
      <Link href="/admin/claims" className="mb-4 inline-flex items-center gap-1 text-[14px] font-semibold text-forest lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> All claims
      </Link>
      <div className="flex flex-wrap items-center gap-[34px]">
        <h1 className="text-[36px] font-semibold tracking-[-0.02em]">{claim.ref}</h1>
        <AdminBadge status={claim.status} className="h-[46px] w-[130px] rounded-[4px] text-[18px] font-medium" />
      </div>

      <div className="mt-[18px] grid gap-8 xl:grid-cols-[auto_auto] xl:justify-start xl:gap-[90px]">
        <section>
          <h2 className="text-[18px] font-semibold">Baseline photos</h2>
          <div className="mt-[18px] flex flex-wrap gap-[25px]">
            {baselineSlots.map((_, i) => (
              <PhotoBox key={i} src={baseline[i]} tone="green" alt={`Baseline photo ${i + 1}`} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold">Crash photos</h2>
          <div className="mt-[18px] flex flex-wrap gap-[25px]">
            {crashSlots.map((_, i) => (
              <PhotoBox key={i} src={crash[i]} tone="yellow" alt={`Crash photo ${i + 1}`} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-[112px] flex min-h-[46px] flex-wrap items-center justify-between gap-2 rounded-[4px] bg-mint px-[70px] py-2 text-[18px] font-semibold">
        <span>{claim.driver_name}</span>
        <span>Location: {claim.address}</span>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-2 text-[16px] sm:grid-cols-[140px_1fr]">
        <dt className="font-semibold">Accident date</dt>
        <dd>{formatLongDate(claim.incident_date)}</dd>
        <dt className="font-semibold">What happened</dt>
        <dd className="whitespace-pre-wrap">{claim.description || "—"}</dd>
        {claim.admin_note ? (
          <>
            <dt className="font-semibold">Note to driver</dt>
            <dd>{claim.admin_note}</dd>
          </>
        ) : null}
      </dl>

      {asking ? (
        <form
          className="mt-8 flex max-w-[600px] flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim()) review("needs_info", note.trim());
          }}
        >
          <label htmlFor="note" className="text-[14px] font-semibold">
            What do you need from the driver?
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-24 rounded-card bg-mint p-4 outline-none focus:ring-2 focus:ring-green"
            placeholder="e.g. Please add a photo of the other vehicle's plate number"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!note.trim() || !!busy}
              className="h-[46px] rounded-[4px] bg-forest px-6 text-[18px] font-medium text-white disabled:opacity-50"
            >
              Send request
            </button>
            <button type="button" onClick={() => setAsking(false)} className="h-[46px] px-4 text-[16px] font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-[90px] flex flex-wrap gap-4 lg:gap-[54px]">
          <button
            onClick={() => review("paid")}
            disabled={!!busy || decided}
            className="h-[46px] w-[130px] rounded-[4px] bg-lime text-[18px] font-medium disabled:opacity-50"
          >
            {busy === "paid" ? "…" : "Approve"}
          </button>
          <button
            onClick={() => review("rejected")}
            disabled={!!busy || decided}
            className="h-[46px] w-[130px] rounded-[4px] border-[1.5px] border-forest text-[18px] font-medium text-forest disabled:opacity-50"
          >
            {busy === "rejected" ? "…" : "Reject"}
          </button>
          <button
            onClick={() => setAsking(true)}
            disabled={!!busy || decided}
            className="h-[46px] w-[230px] rounded-[4px] border border-ink text-[18px] font-medium disabled:opacity-50"
          >
            Ask for more info
          </button>
        </div>
      )}
    </div>
  );
}
