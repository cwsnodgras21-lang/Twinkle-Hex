/**
 * Releases / collections — planning deadlines + polish membership.
 * Polishes remain standalone; this is a join, not ownership.
 */

import { createClient } from "@/supabase/server";
import { resolveWriteClient, num } from "@/lib/admin/supabase-write";
import { coalesceReleaseDeadlines, type LeadTimeDefaults } from "@/lib/ops/release-deadlines";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import type {
  Release,
  ReleasePolish,
  ReleasePolishProductionStatus,
  ReleaseStatus,
} from "@/types/admin";

function mapRelease(row: Record<string, unknown>): Release {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    status: (row.status as ReleaseStatus) ?? "planned",
    target_launch_date: (row.target_launch_date as string) ?? undefined,
    production_complete_by: (row.production_complete_by as string) ?? undefined,
    swatcher_send_by: (row.swatcher_send_by as string) ?? undefined,
    swatch_return_by: (row.swatch_return_by as string) ?? undefined,
    marketing_ready_by: (row.marketing_ready_by as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapReleasePolish(row: Record<string, unknown>): ReleasePolish {
  return {
    id: row.id as string,
    release_id: row.release_id as string,
    polish_id: row.polish_id as string,
    sort_order: num(row.sort_order),
    production_status: (row.production_status as ReleasePolishProductionStatus) ?? "needed",
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function leadTimes(): Promise<LeadTimeDefaults> {
  const s = await getOpsSettings();
  return {
    lead_marketing_days: s.lead_marketing_days,
    lead_swatch_return_days: s.lead_swatch_return_days,
    lead_swatcher_send_days: s.lead_swatcher_send_days,
    lead_production_complete_days: s.lead_production_complete_days,
  };
}

export async function listReleases(): Promise<Release[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("releases")
    .select("*")
    .order("target_launch_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRelease(r as Record<string, unknown>));
}

export async function getReleaseById(id: string): Promise<Release | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("releases").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapRelease(data as Record<string, unknown>) : null;
}

export type ReleasePolishWithPolish = ReleasePolish & {
  polish_name?: string;
  polish_color_hex?: string;
  formula_version?: number;
  line_count?: number;
};

export async function listReleasePolishes(releaseId: string): Promise<ReleasePolishWithPolish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .select("*, polishes ( name, color_hex, formula_version )")
    .eq("release_id", releaseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapReleasePolish(row);
    const polish = row.polishes as { name?: string; color_hex?: string; formula_version?: number } | null;
    return {
      ...base,
      polish_name: polish?.name,
      polish_color_hex: polish?.color_hex,
      formula_version: polish?.formula_version,
    };
  });
}

export type CreateReleaseInput = {
  name: string;
  description?: string | null;
  status?: ReleaseStatus;
  target_launch_date?: string | null;
  production_complete_by?: string | null;
  swatcher_send_by?: string | null;
  swatch_return_by?: string | null;
  marketing_ready_by?: string | null;
  notes?: string | null;
  /** When true (default), fill missing deadlines from launch + lead times. */
  derive_missing_deadlines?: boolean;
};

export async function createRelease(input: CreateReleaseInput): Promise<Release> {
  const supabase = await resolveWriteClient();
  const leads = await leadTimes();
  const derived =
    input.derive_missing_deadlines === false
      ? {
          production_complete_by: input.production_complete_by ?? null,
          swatcher_send_by: input.swatcher_send_by ?? null,
          swatch_return_by: input.swatch_return_by ?? null,
          marketing_ready_by: input.marketing_ready_by ?? null,
        }
      : coalesceReleaseDeadlines({
          target_launch_date: input.target_launch_date,
          production_complete_by: input.production_complete_by,
          swatcher_send_by: input.swatcher_send_by,
          swatch_return_by: input.swatch_return_by,
          marketing_ready_by: input.marketing_ready_by,
          leads,
        });

  const { data, error } = await supabase
    .from("releases")
    .insert({
      name: input.name.trim(),
      description: input.description ?? null,
      status: input.status ?? "planned",
      target_launch_date: input.target_launch_date ?? null,
      production_complete_by: derived.production_complete_by,
      swatcher_send_by: derived.swatcher_send_by,
      swatch_return_by: derived.swatch_return_by,
      marketing_ready_by: derived.marketing_ready_by,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRelease(data as Record<string, unknown>);
}

export type UpdateReleaseInput = Partial<CreateReleaseInput>;

export async function updateRelease(id: string, input: UpdateReleaseInput): Promise<Release> {
  const supabase = await resolveWriteClient();
  const existing = await getReleaseById(id);
  if (!existing) throw new Error("Release not found");

  const leads = await leadTimes();
  const launch = input.target_launch_date !== undefined ? input.target_launch_date : existing.target_launch_date;
  const shouldDerive = input.derive_missing_deadlines !== false;

  const derived = shouldDerive
    ? coalesceReleaseDeadlines({
        target_launch_date: launch,
        production_complete_by:
          input.production_complete_by !== undefined
            ? input.production_complete_by
            : existing.production_complete_by,
        swatcher_send_by:
          input.swatcher_send_by !== undefined ? input.swatcher_send_by : existing.swatcher_send_by,
        swatch_return_by:
          input.swatch_return_by !== undefined ? input.swatch_return_by : existing.swatch_return_by,
        marketing_ready_by:
          input.marketing_ready_by !== undefined
            ? input.marketing_ready_by
            : existing.marketing_ready_by,
        leads,
      })
    : {
        production_complete_by: input.production_complete_by ?? existing.production_complete_by ?? null,
        swatcher_send_by: input.swatcher_send_by ?? existing.swatcher_send_by ?? null,
        swatch_return_by: input.swatch_return_by ?? existing.swatch_return_by ?? null,
        marketing_ready_by: input.marketing_ready_by ?? existing.marketing_ready_by ?? null,
      };

  const patch: Record<string, unknown> = {
    production_complete_by: derived.production_complete_by,
    swatcher_send_by: derived.swatcher_send_by,
    swatch_return_by: derived.swatch_return_by,
    marketing_ready_by: derived.marketing_ready_by,
  };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.target_launch_date !== undefined) patch.target_launch_date = input.target_launch_date;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase.from("releases").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return mapRelease(data as Record<string, unknown>);
}

export async function deleteRelease(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("releases").delete().eq("id", id);
  if (error) throw error;
}

export async function addPolishToRelease(
  releaseId: string,
  polishId: string,
  sortOrder = 0
): Promise<ReleasePolish> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .insert({
      release_id: releaseId,
      polish_id: polishId,
      sort_order: sortOrder,
      production_status: "needed",
    })
    .select()
    .single();
  if (error) throw error;
  return mapReleasePolish(data as Record<string, unknown>);
}

export async function removePolishFromRelease(releasePolishId: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("release_polishes").delete().eq("id", releasePolishId);
  if (error) throw error;
}

export async function updateReleasePolishStatus(
  releasePolishId: string,
  production_status: ReleasePolishProductionStatus
): Promise<ReleasePolish> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .update({ production_status })
    .eq("id", releasePolishId)
    .select()
    .single();
  if (error) throw error;
  return mapReleasePolish(data as Record<string, unknown>);
}

/** Count remaining production work: polishes not yet complete for a release. */
export async function countRemainingBatchesForRelease(releaseId: string): Promise<{
  polishCount: number;
  remainingBatches: number;
  missingFormulaCount: number;
}> {
  const supabase = await createClient();
  const members = await listReleasePolishes(releaseId);
  let missingFormulaCount = 0;
  for (const m of members) {
    const { count } = await supabase
      .from("polish_recipe_lines")
      .select("id", { count: "exact", head: true })
      .eq("polish_id", m.polish_id);
    if (!count) missingFormulaCount += 1;
  }
  const remainingBatches = members.filter((m) => m.production_status !== "complete").length;
  return { polishCount: members.length, remainingBatches, missingFormulaCount };
}
