"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { IS_DEMO } from "@/lib/config";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/home";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { needsConfirmation } = await api.signUp({
          email,
          password,
          full_name: String(form.get("full_name") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
        });
        if (needsConfirmation) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        await api.signIn(email, password);
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pattern-home min-h-dvh">
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-screen pt-[46px] pb-10">
        <Logo className="text-[18px]" />

        <h1 className="mt-[44px] font-display text-[24px] leading-tight tracking-[-0.03em]">
          {mode === "signin" ? "Welcome back" : "Get covered today"}
        </h1>
        <p className="mt-2 text-[16px] text-ink/75">
          {mode === "signin"
            ? "Sign in to check your cover and claims."
            : `Accident and repair cover from ₦300 a day.`}
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 rounded-card bg-white/85 py-1 backdrop-blur-[1px]">
          {mode === "signup" ? (
            <>
              <TextField label="Full name" name="full_name" autoComplete="name" required placeholder="Tola Adebayo" />
              <TextField
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="0801 234 5678"
              />
            </>
          ) : null}
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required={!IS_DEMO}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={IS_DEMO ? undefined : 6}
            required={!IS_DEMO}
            placeholder="••••••••"
          />

          {error ? (
            <p role="alert" className="rounded-[8px] bg-ink px-4 py-3 text-[14px] text-white">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-[8px] bg-leaf px-4 py-3 text-[14px]">
              {notice}
            </p>
          ) : null}

          <Button type="submit" variant="cta" size="lg" loading={busy} className="mt-5">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-5 self-center rounded-[6px] bg-white px-2 text-[16px] font-semibold text-green underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        {IS_DEMO ? (
          <p className="mt-auto rounded-[8px] bg-mint px-4 py-3 text-[12px] text-ink/80">
            Demo mode — no Supabase keys set, so any details work and data stays in this browser.
          </p>
        ) : null}
      </main>
    </div>
  );
}
