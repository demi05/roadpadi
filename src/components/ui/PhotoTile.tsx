"use client";

import { useEffect, useMemo, useRef } from "react";
import { Camera, CarFront, X } from "lucide-react";

type Props = {
  file: Blob | null;
  onPick: (file: Blob | null) => void;
  icon?: "car" | "camera";
  label: string;
  className?: string;
};

/** Dashed mint tile that opens the phone camera and previews the shot. */
export function PhotoTile({ file, onPick, icon = "camera", label, className = "" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  const Icon = icon === "car" ? CarFront : Camera;

  return (
    <div className={`dashed-tile relative overflow-hidden rounded-card bg-mint ${className}`}>
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={url} alt={label} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-label={`Remove ${label}`}
            className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-ink/70 text-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label={`Add ${label}`}
          className="grid size-full place-items-center text-ink/85 transition-colors hover:bg-leaf/30"
        >
          <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Read-only thumbnail (review screens). */
export function Thumb({ src, icon = "camera", alt }: { src?: string | null; icon?: "car" | "camera"; alt: string }) {
  const Icon = icon === "car" ? CarFront : Camera;
  return (
    <div className="dashed-tile grid aspect-[100/91] place-items-center overflow-hidden rounded-card bg-mint">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob/signed URLs
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <Icon className="size-[15px] text-ink/85" strokeWidth={2} aria-label={alt} />
      )}
    </div>
  );
}
