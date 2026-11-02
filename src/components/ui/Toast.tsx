"use client";

import { useEffect } from "react";

export function Toast({ message, onDone, tone = "ok" }: { message: string | null; onDone: () => void; tone?: "ok" | "error" }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[90px] z-30 flex justify-center px-screen">
      <p
        role="status"
        className={`animate-fade-up rounded-[10px] px-4 py-3 text-[14px] font-semibold shadow-[0_6px_20px_rgba(0,84,8,0.18)] ${
          tone === "ok" ? "bg-forest text-white" : "bg-ink text-white"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
