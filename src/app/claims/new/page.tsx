"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/Field";
import { FlowScreen, StepLabel } from "@/components/ui/FlowScreen";
import { PhotoTile, Thumb } from "@/components/ui/PhotoTile";
import { SuccessScreen } from "@/components/ui/SuccessScreen";
import { api } from "@/lib/api";
import { coverState, formatLongDate, todayLagos } from "@/lib/cover";
import { useMe, useNow } from "@/lib/hooks";
import type { Claim } from "@/lib/types";

const TILE_LABELS = ["front damage photo", "second photo", "third photo", "fourth photo"];
const TITLES = ["Add photos", "What Happened?", "Review Claim"];
const PROGRESS = [0.33, 0.6, 1];

export default function NewClaimPage() {
  const router = useRouter();
  const me = useMe();
  const now = useNow();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<(Blob | null)[]>([null, null, null, null]);
  const [date, setDate] = useState(() => todayLagos());
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Claim | null>(null);

  const picked = photos.filter((p): p is Blob => !!p);
  const previews = useMemo(() => picked.map((p) => URL.createObjectURL(p)), [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (submitted) {
    return (
      <SuccessScreen
        title="Claim submitted"
        message="We'll update you within 24 hours"
        action={
          <LinkButton href={`/claims/${submitted.id}`} variant="cta" size="lg">
            Track Claim
          </LinkButton>
        }
      >
        <p className="animate-fade-up mt-[46px] grid h-[46px] w-[194px] place-items-center rounded-[8px] bg-mint text-[16px] font-semibold">
          {submitted.ref}
        </p>
      </SuccessScreen>
    );
  }

  // Claims open once cover is active
  if (!me.loading && now && coverState(me.data?.policy ?? null, now) === "none") {
    return (
      <FlowScreen title="Report an accident" back="/home">
        <div className="mt-10 rounded-card bg-stone p-5">
          <p className="text-[18px] font-semibold">Claims open once cover is active</p>
          <p className="mt-2 text-[16px]">Activate cover from ₦300 a day, then report any accident here.</p>
        </div>
        <LinkButton href={me.data?.inspection ? "/activate" : "/inspection"} variant="alternate" className="mt-8">
          Activate cover
        </LinkButton>
      </FlowScreen>
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const claim = await api.createClaim({ incident_date: date, address, description, photos: picked });
      setSubmitted(claim);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit claim");
    } finally {
      setBusy(false);
    }
  }

  const back = step === 0 ? () => router.push("/home") : () => setStep(step - 1);
  const canContinue = step === 0 ? picked.length > 0 : step === 1 ? !!date && address.trim().length > 2 : true;

  return (
    <FlowScreen
      title={TITLES[step]}
      back={back}
      progress={PROGRESS[step]}
      footer={
        <>
          {error ? (
            <p role="alert" className="mb-3 rounded-[8px] bg-ink px-4 py-3 text-[14px] text-white">
              {error}
            </p>
          ) : null}
          {step < 2 ? (
            <Button variant="cta" size="lg" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="cta" size="lg" loading={busy} onClick={submit}>
              Submit Claim
            </Button>
          )}
        </>
      }
    >
      <StepLabel>Step {step + 1} of 3</StepLabel>

      {step === 0 ? (
        <div className="animate-fade-up">
          <div className="grid grid-cols-2 gap-x-[13px] gap-y-[17px]">
            {photos.map((p, i) => (
              <PhotoTile
                key={i}
                file={p}
                icon={i === 0 ? "car" : "camera"}
                label={TILE_LABELS[i]}
                className="h-[137px]"
                onPick={(f) => setPhotos((all) => all.map((x, j) => (j === i ? f : x)))}
              />
            ))}
          </div>

          <div className="mt-[92px]">
            <span className="relative z-10 inline-block rounded-[8px] bg-green px-[17px] py-[7px] text-[14px] font-semibold text-white">
              Photograph the damage
            </span>
            <p className="-mt-2 rounded-card bg-mint px-4 pt-[20px] pb-[18px] text-center text-[16px] font-semibold">
              Show all four sides of your car
            </p>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="animate-fade-up flex flex-col gap-[22px]">
          <TextField
            label="Date:"
            name="incident_date"
            type="date"
            value={date}
            max={todayLagos()}
            onChange={(e) => setDate(e.target.value)}
            icon={<Calendar className="size-[20px]" strokeWidth={1.5} aria-hidden />}
            className="[&_input]:font-medium"
          />
          <TextField
            label="Address:"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="4, Ikorodu Road, Lagos"
            autoComplete="street-address"
            required
          />
          <TextArea
            label="Describe what happened:"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us how it happened"
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-fade-up flex flex-col gap-[13px]">
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <Thumb key={i} src={src} alt={`Accident photo ${i + 1}`} />
            ))}
          </div>
          <div className="mt-[11px] flex h-9 items-center gap-[10px] rounded-[8px] bg-mint px-[17px] text-[16px] font-medium">
            <Calendar className="size-5" strokeWidth={1.5} aria-hidden /> {formatLongDate(date)}
          </div>
          <div className="mt-2 flex h-10 items-center gap-[10px] rounded-[8px] bg-mint px-[17px] text-[16px] font-medium">
            <MapPin className="size-[22px]" strokeWidth={2} aria-hidden /> {address}
          </div>
          <div className="mt-[3px] min-h-[195px] rounded-card bg-mint px-5 py-6 text-[12px] font-medium whitespace-pre-wrap">
            {description || "Describe what happened"}
          </div>
        </div>
      ) : null}
    </FlowScreen>
  );
}
