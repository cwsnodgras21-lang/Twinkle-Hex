/**
 * Ops settings — documented defaults for batch size and lead times.
 */

import { resolveWriteClient, resolveDataClient, num } from "@/lib/admin/supabase-write";
import type { OpsSettings } from "@/types/admin";
import { DEFAULT_BATCH_OZ, DEFAULT_LEAD_TIMES, DEFAULT_PRODUCTION_WEEKDAYS } from "@/lib/ops";

export const FALLBACK_OPS_SETTINGS: OpsSettings = {
  id: 1,
  default_batch_oz: DEFAULT_BATCH_OZ,
  lead_marketing_days: DEFAULT_LEAD_TIMES.lead_marketing_days,
  lead_swatch_return_days: DEFAULT_LEAD_TIMES.lead_swatch_return_days,
  lead_swatcher_send_days: DEFAULT_LEAD_TIMES.lead_swatcher_send_days,
  lead_production_complete_days: DEFAULT_LEAD_TIMES.lead_production_complete_days,
  production_weekdays: [...DEFAULT_PRODUCTION_WEEKDAYS],
  max_batches_per_day: 2,
  updated_at: new Date(0).toISOString(),
};

function mapRow(row: Record<string, unknown>): OpsSettings {
  const weekdays = Array.isArray(row.production_weekdays)
    ? (row.production_weekdays as number[])
    : [...DEFAULT_PRODUCTION_WEEKDAYS];
  return {
    id: num(row.id, 1),
    default_batch_oz: num(row.default_batch_oz, DEFAULT_BATCH_OZ),
    lead_marketing_days: num(row.lead_marketing_days, DEFAULT_LEAD_TIMES.lead_marketing_days),
    lead_swatch_return_days: num(
      row.lead_swatch_return_days,
      DEFAULT_LEAD_TIMES.lead_swatch_return_days
    ),
    lead_swatcher_send_days: num(
      row.lead_swatcher_send_days,
      DEFAULT_LEAD_TIMES.lead_swatcher_send_days
    ),
    lead_production_complete_days: num(
      row.lead_production_complete_days,
      DEFAULT_LEAD_TIMES.lead_production_complete_days
    ),
    production_weekdays: weekdays,
    max_batches_per_day: num(row.max_batches_per_day, 2),
    updated_at: (row.updated_at as string) ?? FALLBACK_OPS_SETTINGS.updated_at,
  };
}

export async function getOpsSettings(): Promise<OpsSettings> {
  try {
    const supabase = await resolveDataClient();
    const { data, error } = await supabase.from("ops_settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return FALLBACK_OPS_SETTINGS;
    return mapRow(data as Record<string, unknown>);
  } catch {
    return FALLBACK_OPS_SETTINGS;
  }
}

export async function updateOpsSettings(
  patch: Partial<Omit<OpsSettings, "id" | "updated_at">>
): Promise<OpsSettings> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("ops_settings")
    .upsert({ id: 1, ...patch })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
