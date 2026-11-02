"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bucket } from "@/lib/api";
import { api } from "@/lib/api";

type AsyncState<T> = {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

/** Small fetch-on-mount helper for the client screens. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fn()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

export function useMe() {
  return useAsync(() => api.getMe());
}

/**
 * Re-renders every `ms` so countdowns stay live. Starts as 0 (unknown) so the
 * clock is only read in the browser, never during prerender.
 */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useMediaUrls(bucket: Bucket, paths: string[] | undefined) {
  const key = (paths ?? []).join("|");
  return useAsync(() => api.mediaUrls(bucket, paths ?? []), [bucket, key]).data ?? [];
}
