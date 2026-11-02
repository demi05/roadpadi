"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

/** Splash — brand pattern + centred lock-up, then on to the app. */
export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/home"), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="pattern-splash grid min-h-dvh place-items-center">
      <div className="animate-fade-up rounded-[6px] bg-sprout px-2 py-1">
        <Logo className="text-[26px]" />
      </div>
    </main>
  );
}
