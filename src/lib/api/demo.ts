"use client";

import { DAY_MS, ENDING_SOON_MS, nextPaymentAt, type CoverState } from "@/lib/cover";
import { blobToDataUrl, compressImage } from "@/lib/image";
import type { Claim, Inspection, Payment, Policy, Profile } from "@/lib/types";
import type { Backend } from "./types";

/*
  Demo backend: everything lives in localStorage so the full flow can be
  clicked through without a Supabase project. Video clips are kept in memory.
*/

const KEY = "roadpadi-demo-v1";
const ME = "demo-tola";

type DemoDb = {
  profiles: Profile[];
  policies: Policy[];
  inspections: Inspection[];
  claims: Claim[];
  payments: Payment[];
  nextRef: number;
};

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const year = new Date().getFullYear();

function seed(): DemoDb {
  const person = (id: string, full_name: string, role: Profile["role"] = "driver"): Profile => ({
    id,
    full_name,
    phone: "+234 801 234 5678",
    email: `${id}@roadpadi.demo`,
    role,
    created_at: iso(-40 * DAY_MS),
  });
  const policy = (user_id: string, expires: number | null): Policy => ({
    user_id,
    daily_amount: 300,
    payment_method: "wallet",
    payment_time: "06:00",
    cover_expires_at: expires === null ? null : iso(expires),
    activated_at: expires === null ? null : iso(-30 * DAY_MS),
  });
  const claim = (ref: number, user_id: string, status: Claim["status"], date: string): Claim => ({
    id: `claim-${ref}`,
    ref: `RP-${ref}`,
    user_id,
    incident_date: date,
    address: "4, Ikorodu Road, Lagos",
    description: "Another bus hit my car from the side at the junction.",
    photos: [],
    status,
    admin_note: null,
    created_at: `${date}T09:30:00.000Z`,
  });

  return {
    profiles: [
      person(ME, "Tola", "admin"),
      person("demo-ade", "Ade A."),
      person("demo-hamad", "Hamad T."),
      person("demo-chike", "Chike O."),
      person("demo-eunice", "Eunice R."),
    ],
    policies: [
      policy(ME, 18 * 60 * 60 * 1000 + 24 * 60 * 1000),
      policy("demo-ade", 10 * 60 * 60 * 1000),
      policy("demo-hamad", 2 * 60 * 60 * 1000),
      policy("demo-chike", null),
      policy("demo-eunice", 20 * 60 * 60 * 1000),
    ],
    inspections: [
      { id: "insp-tola", user_id: ME, photos: {}, clip_path: null, created_at: iso(-30 * DAY_MS) },
      { id: "insp-ade", user_id: "demo-ade", photos: {}, clip_path: null, created_at: iso(-30 * DAY_MS) },
    ],
    claims: [
      claim(1037, "demo-ade", "in_review", `${year}-10-10`),
      claim(1024, ME, "in_review", `${year}-10-09`),
      claim(1018, "demo-hamad", "paid", `${year}-10-05`),
      claim(1001, ME, "paid", `${year}-09-20`),
    ],
    payments: [
      { id: "pay-1", user_id: ME, amount: 300, method: "wallet", kind: "daily", created_at: iso(-6 * 60 * 60 * 1000) },
      { id: "pay-2", user_id: ME, amount: 300, method: "wallet", kind: "daily", created_at: iso(-30 * 60 * 60 * 1000) },
    ],
    nextRef: 1038,
  };
}

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch {
    /* fall through to a fresh seed */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DemoDb) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Storage full (lots of photos) — keep going in memory for this session.
  }
}

function mutate<T>(fn: (db: DemoDb) => T): T {
  const db = load();
  const out = fn(db);
  save(db);
  return out;
}

const clips = new Map<string, string>();
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const myPolicy = (db: DemoDb) => db.policies.find((p) => p.user_id === ME)!;

export const demoBackend: Backend = {
  async signIn() {
    await wait();
  },
  async signUp({ full_name, phone }) {
    await wait();
    mutate((db) => {
      const me = db.profiles.find((p) => p.id === ME)!;
      if (full_name) me.full_name = full_name;
      if (phone) me.phone = phone;
    });
    return { needsConfirmation: false };
  },
  async signOut() {
    await wait(100);
  },

  async getMe() {
    const db = load();
    return {
      profile: db.profiles.find((p) => p.id === ME)!,
      policy: myPolicy(db),
      inspection: db.inspections.filter((i) => i.user_id === ME).at(-1) ?? null,
    };
  },

  async updateProfile(input) {
    await wait();
    return mutate((db) => Object.assign(db.profiles.find((p) => p.id === ME)!, input));
  },

  async setPaymentMethod(method) {
    mutate((db) => {
      myPolicy(db).payment_method = method;
    });
  },

  async saveInspection({ photos, clip }) {
    const stored: Inspection["photos"] = {};
    for (const [side, blob] of Object.entries(photos)) {
      if (blob) stored[side as keyof typeof stored] = await blobToDataUrl(await compressImage(blob, 640, 0.6));
    }
    let clipPath: string | null = null;
    if (clip) {
      clipPath = `clip-${Date.now()}`;
      clips.set(clipPath, URL.createObjectURL(clip));
    }
    const inspection: Inspection = {
      id: `insp-${Date.now()}`,
      user_id: ME,
      photos: stored,
      clip_path: clipPath,
      created_at: new Date().toISOString(),
    };
    mutate((db) => db.inspections.push(inspection));
    return inspection;
  },

  async activateCover(method) {
    await wait(500);
    return mutate((db) => {
      const p = myPolicy(db);
      let until = nextPaymentAt(p.payment_time).getTime();
      if (until - Date.now() < 6 * 60 * 60 * 1000) until += DAY_MS;
      const current = p.cover_expires_at ? new Date(p.cover_expires_at).getTime() : 0;
      p.payment_method = method;
      p.activated_at = new Date().toISOString();
      p.cover_expires_at = new Date(Math.max(current, until)).toISOString();
      return { ...p };
    });
  },

  async topUp() {
    await wait(500);
    return mutate((db) => {
      const p = myPolicy(db);
      const from = Math.max(Date.now(), p.cover_expires_at ? new Date(p.cover_expires_at).getTime() : 0);
      p.cover_expires_at = new Date(from + DAY_MS).toISOString();
      db.payments.unshift({
        id: `pay-${Date.now()}`,
        user_id: ME,
        amount: p.daily_amount,
        method: p.payment_method,
        kind: "topup",
        created_at: new Date().toISOString(),
      });
      return { ...p };
    });
  },

  async listMyClaims() {
    return load()
      .claims.filter((c) => c.user_id === ME)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getClaim(id) {
    return load().claims.find((c) => c.id === id) ?? null;
  },

  async createClaim({ incident_date, address, description, photos }) {
    const urls: string[] = [];
    for (const blob of photos) urls.push(await blobToDataUrl(await compressImage(blob, 640, 0.6)));
    await wait(400);
    return mutate((db) => {
      const ref = db.nextRef++;
      const claim: Claim = {
        id: `claim-${ref}`,
        ref: `RP-${ref}`,
        user_id: ME,
        incident_date,
        address,
        description,
        photos: urls,
        status: "in_review",
        admin_note: null,
        created_at: new Date().toISOString(),
      };
      db.claims.push(claim);
      return claim;
    });
  },

  async listPayments() {
    return load().payments.filter((p) => p.user_id === ME);
  },

  async mediaUrls(_bucket, paths) {
    return paths.map((p) => clips.get(p) ?? p);
  },

  async adminListClaims(status) {
    const db = load();
    return db.claims
      .filter((c) => !status || c.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((c) => ({ ...c, driver_name: db.profiles.find((p) => p.id === c.user_id)?.full_name ?? "Driver" }));
  },

  async adminGetClaim(id) {
    const db = load();
    const c = db.claims.find((x) => x.id === id);
    if (!c) return null;
    return {
      claim: { ...c, driver_name: db.profiles.find((p) => p.id === c.user_id)?.full_name ?? "Driver" },
      inspection: db.inspections.filter((i) => i.user_id === c.user_id).at(-1) ?? null,
    };
  },

  async adminReviewClaim(id, status, note) {
    await wait();
    mutate((db) => {
      const c = db.claims.find((x) => x.id === id);
      if (c) {
        c.status = status;
        c.admin_note = note ?? null;
      }
    });
  },

  async adminListDrivers() {
    const db = load();
    return db.profiles.map((p) => ({ ...p, policy: db.policies.find((x) => x.user_id === p.id) ?? null }));
  },
};

/** Demo-only: jump the home screen between its three designed states. */
export function setDemoCover(state: CoverState) {
  mutate((db) => {
    const p = myPolicy(db);
    if (state === "none") {
      p.cover_expires_at = iso(-60 * 1000);
      return;
    }
    p.activated_at ??= new Date().toISOString();
    p.cover_expires_at = iso(state === "ending" ? ENDING_SOON_MS - 30 * 60 * 1000 : 18 * 60 * 60 * 1000 + 24 * 60 * 1000);
  });
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  clips.clear();
}

