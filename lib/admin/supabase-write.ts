/**
 * Shared Supabase write-client helper for admin data modules.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";

export function getWriteClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
}

export async function resolveWriteClient() {
  const client = getWriteClient();
  return client instanceof Promise ? await client : client;
}

export function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function todayDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
