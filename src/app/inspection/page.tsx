"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera as CameraIcon, Check, FolderPlus, Video } from "lucide-react";
import { Camera } from "@/components/camera/Camera";
import { Button } from "@/components/ui/Button";
import { FlowScreen } from "@/components/ui/FlowScreen";
import { ShieldIcon } from "@/components/ui/ShieldIcon";
import { api } from "@/lib/api";
import { DAILY_AMOUNT, naira } from "@/lib/cover";
import { INSPECTION_SIDES, type InspectionSide } from "@/lib/types";

const SIDE_TITLE: Record<InspectionSide, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left side",
  right: "Right side",
  dashboard: "Dashboard",
};
const CHIP_LABEL: Record<InspectionSide, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left",
  right: "Right",
  dashboard: "Dashboard",
};

type Stage = { kind: "intro" } | { kind: "capture"; index: number; retake?: boolean } | { kind: "photos" } | { kind: "clip" } | { kind: "review" };

/** Baseline inspection: 5 photos + 1 short clip before cover starts. */
export default function InspectionPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [photos, setPhotos] = useState<Partial<Record<InspectionSide, Blob>>>({});
  const [clip, setClip] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPhotos = INSPECTION_SIDES.every((s) => photos[s]);

  if (stage.kind === "intro") {
    return (
      <FlowScreen
        title="Inspection"
        back="/home"
        footer={
          <Button variant="cta" size="lg" onClick={() => setStage({ kind: "capture", index: 0 })}>
            Start
          </Button>
        }
      >
        <div className="animate-fade-up flex flex-col">
          <div className="mx-auto mt-[60px] grid size-[128px] place-items-center rounded-full bg-mint">
            <ShieldIcon variant="check" className="size-[72px] text-lime" />
          </div>
          <p className="mt-[24px] text-center text-[18px] font-semibold tracking-[-0.02em]">Inspect your car</p>
          <div className="mt-[30px] flex flex-col gap-5">
            <div className="flex h-[58px] items-center gap-3 rounded-[8px] bg-mint px-[19px] text-[16px] font-semibold">
              <CameraIcon className="size-[24px]" strokeWidth={1.5} aria-hidden /> 5 photos
            </div>
            <div className="flex h-[58px] items-center gap-3 rounded-[8px] bg-mint px-[19px] text-[16px] font-semibold">
              <Video className="size-[24px]" strokeWidth={1.5} aria-hidden /> 1 clip
            </div>
          </div>
          <p className="mt-6 text-[12px] font-medium text-ink/70">
            These photos show how your car looks today, so claims are settled faster.
          </p>
        </div>
      </FlowScreen>
    );
  }

  if (stage.kind === "capture") {
    const side = INSPECTION_SIDES[stage.index];
    const n = stage.index + 1;
    return (
      <FlowScreen
        key={side}
        title={SIDE_TITLE[side]}
        right={`${n}/5`}
        progress={n / 5}
        back={() =>
          stage.retake || stage.index === 0
            ? setStage(stage.retake ? { kind: "photos" } : { kind: "intro" })
            : setStage({ kind: "capture", index: stage.index - 1 })
        }
      >
        <Camera
          mode="photo"
          label={SIDE_TITLE[side]}
          onCapture={(blob) => {
            const next = { ...photos, [side]: blob };
            setPhotos(next);
            const missing = INSPECTION_SIDES.findIndex((s) => !next[s]);
            if (stage.retake || missing === -1) setStage({ kind: "photos" });
            else setStage({ kind: "capture", index: stage.index + 1 < 5 ? stage.index + 1 : missing });
          }}
        />
      </FlowScreen>
    );
  }

  if (stage.kind === "photos") {
    const chip = (side: InspectionSide, wide = false) => {
      const done = !!photos[side];
      return (
        <button
          key={side}
          type="button"
          onClick={() => setStage({ kind: "capture", index: INSPECTION_SIDES.indexOf(side), retake: true })}
          className={`flex w-full items-center justify-center gap-2 rounded-card text-[16px] text-forest transition-colors ${
            wide ? "h-[62px]" : "h-[46px]"
          } ${done ? "border border-forest bg-mint" : "dashed-tile bg-white hover:bg-mint/50"}`}
          aria-label={done ? `Retake ${CHIP_LABEL[side]} photo` : `Take ${CHIP_LABEL[side]} photo`}
        >
          {done ? (
            <Check className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <FolderPlus className="size-[18px]" strokeWidth={1.5} aria-hidden />
          )}
          {CHIP_LABEL[side]}
        </button>
      );
    };
    return (
      <FlowScreen
        title="Your photos"
        back={() => setStage({ kind: "capture", index: 4 })}
        progress={0.48}
        footer={
          <Button variant="cta" size="lg" disabled={!allPhotos} onClick={() => setStage({ kind: "clip" })}>
            Next Clip
          </Button>
        }
      >
        <div className="animate-fade-up mt-[60px] grid grid-cols-2 gap-x-[13px] gap-y-[11px]">
          {chip("front")}
          {chip("rear")}
          {chip("left")}
          {chip("right")}
          <div className="col-span-2 mt-[22px]">{chip("dashboard", true)}</div>
        </div>
        {!allPhotos ? (
          <p className="mt-5 text-[12px] font-medium text-ink/70">Tap a dashed box to take the missing photo.</p>
        ) : null}
      </FlowScreen>
    );
  }

  if (stage.kind === "clip") {
    return (
      <FlowScreen title="Short clip" back={() => setStage({ kind: "photos" })} progress={1}>
        <Camera
          mode="video"
          label="Walk around your car"
          onCapture={(blob) => {
            setClip(blob);
            setStage({ kind: "review" });
          }}
        />
      </FlowScreen>
    );
  }

  async function activate() {
    setBusy(true);
    setError(null);
    try {
      await api.saveInspection({ photos, clip });
      router.push("/activate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — check your connection and try again");
      setBusy(false);
    }
  }

  return (
    <FlowScreen
      title="Review"
      back={() => setStage({ kind: "clip" })}
      footer={
        <>
          {error ? (
            <p role="alert" className="mb-3 rounded-[8px] bg-ink px-4 py-3 text-[14px] text-white">
              {error}
            </p>
          ) : null}
          <div className="px-[10px]">
            <Button variant="cta" size="lg" loading={busy} onClick={activate}>
              Activate cover
            </Button>
          </div>
        </>
      }
    >
      <div className="animate-fade-up mt-[20px] flex flex-col gap-5">
        {[
          ["Photos", allPhotos],
          ["Clip", !!clip],
        ].map(([label, ok]) => (
          <div key={String(label)} className="flex h-10 items-center gap-[15px] rounded-[8px] bg-mint px-[14px] text-[16px] font-semibold">
            <span className={`grid size-[25px] place-items-center rounded-full ${ok ? "bg-lime" : "bg-stone"}`}>
              <Check className="size-[15px] text-white" strokeWidth={3} aria-hidden />
            </span>
            {label}
          </div>
        ))}
        <div className="mt-5 rounded-[8px] bg-forest px-5 pt-[20px] pb-[16px] text-white">
          <p className="text-[14px] font-medium">Your Cover</p>
          <p className="mt-[6px] text-[26px] font-semibold tracking-[-0.01em]">{naira(DAILY_AMOUNT)} per day</p>
        </div>
      </div>
    </FlowScreen>
  );
}
