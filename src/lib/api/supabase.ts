import { supabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { Claim, ClaimWithDriver, Driver, Inspection, Me, Policy, Profile } from "@/lib/types";
import type { Backend } from "./types";

async function uid() {
  const { data } = await supabase().auth.getUser();
  if (!data.user) throw new Error("You're signed out. Please sign in again.");
  return data.user.id;
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function upload(bucket: "inspections" | "claims", path: string, blob: Blob) {
  const { error } = await supabase().storage.from(bucket).upload(path, blob, {
    contentType: blob.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

type ClaimRow = Claim & { profiles: { full_name: string } | null };
const withDriver = (row: ClaimRow): ClaimWithDriver => {
  const { profiles, ...claim } = row;
  return { ...claim, driver_name: profiles?.full_name || "Driver" };
};

export const supabaseBackend: Backend = {
  async signIn(email, password) {
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  async signUp({ email, password, full_name, phone }) {
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: { data: { full_name, phone } },
    });
    if (error) throw new Error(error.message);
    return { needsConfirmation: !data.session };
  },

  async signOut() {
    await supabase().auth.signOut();
  },

  async getMe(): Promise<Me | null> {
    const { data } = await supabase().auth.getUser();
    if (!data.user) return null;
    const id = data.user.id;
    const db = supabase();
    const [profile, policy, inspection] = await Promise.all([
      db.from("profiles").select("*").eq("id", id).single(),
      db.from("policies").select("*").eq("user_id", id).maybeSingle(),
      db.from("inspections").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return {
      profile: must(profile) as Profile,
      policy: normalisePolicy(must(policy)),
      inspection: must(inspection) as Inspection | null,
    };
  },

  async updateProfile(input) {
    const id = await uid();
    return must(await supabase().from("profiles").update(input).eq("id", id).select().single()) as Profile;
  },

  async setPaymentMethod(method) {
    const id = await uid();
    must(await supabase().from("policies").update({ payment_method: method }).eq("user_id", id));
  },

  async saveInspection({ photos, clip }) {
    const user = await uid();
    const id = crypto.randomUUID();
    const paths: Inspection["photos"] = {};
    for (const [side, blob] of Object.entries(photos)) {
      if (!blob) continue;
      const small = await compressImage(blob);
      paths[side as keyof typeof paths] = await upload("inspections", `${user}/${id}/${side}.jpg`, small);
    }
    const clipPath = clip
      ? await upload("inspections", `${user}/${id}/clip.${clip.type.includes("mp4") ? "mp4" : "webm"}`, clip)
      : null;
    return must(
      await supabase()
        .from("inspections")
        .insert({ id, user_id: user, photos: paths, clip_path: clipPath })
        .select()
        .single(),
    ) as Inspection;
  },

  async activateCover(method) {
    return normalisePolicy(must(await supabase().rpc("activate_cover", { p_method: method })))!;
  },

  async topUp() {
    return normalisePolicy(must(await supabase().rpc("top_up")))!;
  },

  async listMyClaims() {
    const id = await uid();
    return must(
      await supabase().from("claims").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    ) as Claim[];
  },

  async getClaim(id) {
    return must(await supabase().from("claims").select("*").eq("id", id).maybeSingle()) as Claim | null;
  },

  async createClaim({ incident_date, address, description, photos }) {
    const user = await uid();
    const id = crypto.randomUUID();
    const paths: string[] = [];
    for (const [i, blob] of photos.entries()) {
      paths.push(await upload("claims", `${user}/${id}/${i + 1}.jpg`, await compressImage(blob)));
    }
    return must(
      await supabase()
        .from("claims")
        .insert({ id, user_id: user, incident_date, address, description, photos: paths })
        .select()
        .single(),
    ) as Claim;
  },

  async listPayments() {
    const id = await uid();
    return must(
      await supabase().from("payments").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
    );
  },

  async mediaUrls(bucket, paths) {
    if (paths.length === 0) return [];
    const { data, error } = await supabase().storage.from(bucket).createSignedUrls(paths, 60 * 60);
    if (error) throw new Error(error.message);
    return data.map((d) => d.signedUrl ?? "");
  },

  async adminListClaims(status) {
    let q = supabase().from("claims").select("*, profiles(full_name)").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return (must(await q) as ClaimRow[]).map(withDriver);
  },

  async adminGetClaim(id) {
    const row = must(
      await supabase().from("claims").select("*, profiles(full_name)").eq("id", id).maybeSingle(),
    ) as ClaimRow | null;
    if (!row) return null;
    const inspection = must(
      await supabase()
        .from("inspections")
        .select("*")
        .eq("user_id", row.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ) as Inspection | null;
    return { claim: withDriver(row), inspection };
  },

  async adminReviewClaim(id, status, note) {
    must(await supabase().from("claims").update({ status, admin_note: note ?? null }).eq("id", id));
  },

  async adminListDrivers() {
    const rows = must(
      await supabase().from("profiles").select("*, policies(*)").order("created_at", { ascending: false }),
    ) as (Profile & { policies: Policy | Policy[] | null })[];
    return rows.map(({ policies, ...p }): Driver => ({
      ...p,
      policy: normalisePolicy(Array.isArray(policies) ? (policies[0] ?? null) : policies),
    }));
  },
};

/** Postgres `time` comes back as "06:00:00" — the UI works with "06:00". */
function normalisePolicy(p: Policy | null): Policy | null {
  if (!p) return null;
  return { ...p, payment_time: String(p.payment_time).slice(0, 5) };
}
