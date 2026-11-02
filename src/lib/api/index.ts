import { IS_DEMO } from "@/lib/config";
import { demoBackend } from "./demo";
import { supabaseBackend } from "./supabase";
import type { Backend } from "./types";

export const api: Backend = IS_DEMO ? demoBackend : supabaseBackend;
export type { Backend, Bucket, NewClaim, NewInspection } from "./types";
