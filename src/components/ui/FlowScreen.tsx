"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type Props = {
  title?: ReactNode;
  /** string → link, function → handler, undefined → browser back, false → no back button */
  back?: string | (() => void) | false;
  right?: ReactNode;
  /** 0..1 — the thin full-width bar under the header. Omit to hide. */
  progress?: number;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function BackButton({ back }: { back: Props["back"] }) {
  const router = useRouter();
  const cls =
    "grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] border-ink/85 text-ink transition-colors hover:bg-mint";
  const icon = <ArrowLeft className="size-[15px]" strokeWidth={1.75} aria-hidden />;
  if (typeof back === "string") {
    return (
      <Link href={back} className={cls} aria-label="Go back">
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} aria-label="Go back" onClick={back ? back : () => router.back()}>
      {icon}
    </button>
  );
}

/** Light-green flow screen used by claims, inspection and payment steps. */
export function FlowScreen({ title, back, right, progress, children, footer, className = "" }: Props) {
  return (
    <div className="min-h-dvh bg-wash">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <header className="flex h-[93px] items-end px-screen pb-[21px]">
          <div className="flex w-full items-center gap-[10px]">
            {back === false ? null : <BackButton back={back} />}
            {title ? (
              <h1 className="text-[18px] leading-none font-semibold tracking-[-0.04em] text-ink">{title}</h1>
            ) : null}
            {right ? <div className="ml-auto text-[18px] font-semibold tracking-[-0.02em]">{right}</div> : null}
          </div>
        </header>
        {progress === undefined ? (
          <div className="h-[3px]" />
        ) : (
          <div
            className="h-[3px] w-full bg-mint"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div className="h-full bg-green transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        <main className={`flex flex-1 flex-col px-screen ${className}`}>{children}</main>
        {footer ? <div className="px-screen pt-6 pb-[67px]">{footer}</div> : null}
      </div>
    </div>
  );
}

export function StepLabel({ children }: { children: ReactNode }) {
  return <p className="mt-[22px] mb-[18px] text-[18px] font-semibold tracking-[-0.02em]">{children}</p>;
}
