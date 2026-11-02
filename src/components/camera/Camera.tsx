"use client";

import { useEffect, useRef, useState } from "react";
import { CarFront } from "lucide-react";

const MAX_CLIP_SECONDS = 15;

type Props = {
  mode: "photo" | "video";
  onCapture: (blob: Blob) => void;
  /** Hint read by screen readers / shown under the frame */
  label: string;
};

/**
 * Viewfinder from the inspection screens: forest-green frame, dashed guide,
 * big round shutter. Uses the live camera when allowed, otherwise falls back
 * to the phone's native camera via a file input.
 */
export function Camera({ mode, onCapture, label }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => {
      cancelled = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_CLIP_SECONDS) recorderRef.current?.stop();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [recording]);

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    canvas.toBlob((b) => b && onCapture(b), "image/jpeg", 0.85);
  }

  function toggleRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    const type = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 1_000_000 } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      setRecording(false);
      onCapture(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
    };
    recorderRef.current = recorder;
    setSeconds(0);
    recorder.start();
    setRecording(true);
  }

  function onShutter() {
    if (!live) return fileRef.current?.click();
    if (mode === "photo") snap();
    else toggleRecording();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mt-[60px] h-[271px] overflow-hidden rounded-card bg-forest">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 size-full object-cover transition-opacity ${live ? "opacity-100" : "opacity-0"}`}
        />
        <div className="dashed-frame absolute inset-x-[38px] top-[55px] h-[160px] rounded-[14px]" />
        {!live ? (
          <CarFront
            className="absolute top-1/2 left-1/2 size-[42px] -translate-x-1/2 -translate-y-1/2 text-mint"
            strokeWidth={2}
            aria-hidden
          />
        ) : null}
        {flash ? <div className="absolute inset-0 bg-white/70" /> : null}
        {mode === "video" && recording ? (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[4px] bg-ink px-[14px] py-[2px] text-[18px] font-semibold tracking-[-0.03em] text-white">
            <span className="animate-rec">REC</span> 00:{String(seconds).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {label}
      </p>

      <div className="flex flex-1 items-center justify-center pb-10">
        <button
          type="button"
          onClick={onShutter}
          aria-label={mode === "photo" ? `Take ${label} photo` : recording ? "Stop recording" : "Start recording"}
          className="grid size-[80px] place-items-center rounded-full border-[4px] border-lime bg-mint transition-transform active:scale-95"
        >
          <span
            className={`block rounded-full transition-all ${
              mode === "video" && recording ? "size-[68px] bg-mint" : "size-[66px] bg-lime"
            }`}
          />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={mode === "photo" ? "image/*" : "video/*"}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
