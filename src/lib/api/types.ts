import type {
  Claim,
  ClaimStatus,
  ClaimWithDriver,
  Driver,
  Inspection,
  InspectionSide,
  Me,
  Payment,
  PaymentMethod,
  Policy,
  Profile,
} from "@/lib/types";

export type Bucket = "inspections" | "claims";

export type NewClaim = {
  incident_date: string;
  address: string;
  description: string;
  photos: Blob[];
};

export type NewInspection = {
  photos: Partial<Record<InspectionSide, Blob>>;
  clip: Blob | null;
};

export type SignUp = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
};

export interface Backend {
  // auth
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUp): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;

  // driver
  getMe(): Promise<Me | null>;
  updateProfile(input: { full_name: string; phone: string }): Promise<Profile>;
  setPaymentMethod(method: PaymentMethod): Promise<void>;
  saveInspection(input: NewInspection): Promise<Inspection>;
  activateCover(method: PaymentMethod): Promise<Policy>;
  topUp(): Promise<Policy>;
  listMyClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim | null>;
  createClaim(input: NewClaim): Promise<Claim>;
  listPayments(): Promise<Payment[]>;

  /** Turns stored paths into viewable URLs (signed for private buckets). */
  mediaUrls(bucket: Bucket, paths: string[]): Promise<string[]>;

  // admin
  adminListClaims(status?: ClaimStatus): Promise<ClaimWithDriver[]>;
  adminGetClaim(id: string): Promise<{ claim: ClaimWithDriver; inspection: Inspection | null } | null>;
  adminReviewClaim(id: string, status: ClaimStatus, note?: string): Promise<void>;
  adminListDrivers(): Promise<Driver[]>;
}
