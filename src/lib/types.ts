export type Role = "driver" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role;
  created_at: string;
};

export type PaymentMethod = "bank" | "wallet";

export type Policy = {
  user_id: string;
  daily_amount: number;
  payment_method: PaymentMethod;
  /** "HH:MM" in Africa/Lagos */
  payment_time: string;
  cover_expires_at: string | null;
  activated_at: string | null;
};

export const INSPECTION_SIDES = ["front", "rear", "left", "right", "dashboard"] as const;
export type InspectionSide = (typeof INSPECTION_SIDES)[number];

export type Inspection = {
  id: string;
  user_id: string;
  /** storage paths (Supabase) or data URLs (demo) keyed by side */
  photos: Partial<Record<InspectionSide, string>>;
  clip_path: string | null;
  created_at: string;
};

export type ClaimStatus = "in_review" | "paid" | "rejected" | "needs_info";

export type Claim = {
  id: string;
  ref: string;
  user_id: string;
  incident_date: string;
  address: string;
  description: string;
  photos: string[];
  status: ClaimStatus;
  admin_note: string | null;
  created_at: string;
};

export type ClaimWithDriver = Claim & { driver_name: string };

export type Payment = {
  id: string;
  user_id: string;
  amount: number;
  method: PaymentMethod;
  kind: "topup" | "daily";
  created_at: string;
};

export type Driver = Profile & { policy: Policy | null };

export type Me = {
  profile: Profile;
  policy: Policy | null;
  inspection: Inspection | null;
};
