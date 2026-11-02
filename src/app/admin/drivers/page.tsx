"use client";

import { api } from "@/lib/api";
import { coverRemainingMs, coverState, formatRemaining } from "@/lib/cover";
import { useAsync, useNow } from "@/lib/hooks";

const coverChip = {
  covered: "bg-leaf",
  ending: "bg-amber",
  none: "bg-ink text-white",
} as const;

export default function AdminDriversPage() {
  const drivers = useAsync(() => api.adminListDrivers());
  const now = useNow();
  const cols = "grid grid-cols-[1.2fr_1.4fr_1fr_0.8fr] items-center gap-3";

  return (
    <div className="max-w-[920px]">
      <h1 className="text-[36px] font-semibold tracking-[-0.02em]">Drivers</h1>
      <div className="mt-[46px] overflow-x-auto">
        <div className="min-w-[640px]">
          <div className={`${cols} px-[23px] text-[24px] font-semibold tracking-[-0.01em]`}>
            <span>Driver</span>
            <span>Phone</span>
            <span>Cover</span>
            <span>Left</span>
          </div>
          <ul className="mt-[14px] flex flex-col gap-[23px]">
            {drivers.loading || !now ? <li className="h-[46px] animate-pulse rounded-[4px] bg-mint" /> : null}
            {now
              ? drivers.data?.map((d) => {
                  const state = d.policy?.activated_at ? coverState(d.policy, now) : "none";
                  return (
                    <li
                      key={d.id}
                      className={`${cols} h-[46px] rounded-[4px] bg-mint px-[23px] text-[18px] font-semibold tracking-[-0.01em]`}
                    >
                      <span className="truncate">{d.full_name || d.email}</span>
                      <span className="truncate font-medium">{d.phone || "—"}</span>
                      <span>
                        <span
                          className={`inline-flex h-[34px] min-w-[115px] items-center justify-center rounded-[8px] px-3 ${coverChip[state]}`}
                        >
                          {state === "covered" ? "Covered" : state === "ending" ? "Ending soon" : "Not covered"}
                        </span>
                      </span>
                      <span className="font-medium">
                        {state === "none" ? "—" : formatRemaining(coverRemainingMs(d.policy, now))}
                      </span>
                    </li>
                  );
                })
              : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
