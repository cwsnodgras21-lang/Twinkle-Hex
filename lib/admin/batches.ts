/**
 * Production batches — execution history with immutable formula snapshots.
 */

import { createClient } from "@/supabase/server";
import { resolveWriteClient, num } from "@/lib/admin/supabase-write";
import { getPolishDetail } from "@/lib/admin/polishes";
import { getIngredientById } from "@/lib/admin/ingredients";
import {
  DEFAULT_BATCH_OZ,
  scaleFormula,
  snapshotFormula,
  formulaBaseTotalOz,
} from "@/lib/ops/formula-scaling";
import { assertIngredientUsableInProduction } from "@/lib/ops/release-risk";
import { updateReleasePolishStatus } from "@/lib/admin/releases";
import type { FormulaSnapshotLine, ProductionBatch, ProductionBatchStatus } from "@/types/admin";

function mapBatch(row: Record<string, unknown>): ProductionBatch {
  const snap = row.formula_snapshot;
  const formula_snapshot: FormulaSnapshotLine[] = Array.isArray(snap)
    ? (snap as FormulaSnapshotLine[])
    : [];
  return {
    id: row.id as string,
    polish_id: row.polish_id as string,
    release_id: (row.release_id as string) ?? undefined,
    batch_size_oz: num(row.batch_size_oz, DEFAULT_BATCH_OZ),
    status: (row.status as ProductionBatchStatus) ?? "planned",
    planned_date: (row.planned_date as string) ?? undefined,
    completed_at: (row.completed_at as string) ?? undefined,
    formula_version: num(row.formula_version, 1),
    formula_snapshot,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listBatchesForPolish(polishId: string): Promise<ProductionBatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_batches")
    .select("*")
    .eq("polish_id", polishId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapBatch(r as Record<string, unknown>));
}

export async function listRecentBatches(limit = 50): Promise<
  Array<ProductionBatch & { polish_name?: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_batches")
    .select("*, polishes ( name )")
    .order("planned_date", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapBatch(row);
    const polish = row.polishes as { name?: string } | null;
    return { ...base, polish_name: polish?.name };
  });
}

export type PreviewBatchResult = {
  polish_id: string;
  polish_name: string;
  formula_version: number;
  batch_size_oz: number;
  base_total_oz: number;
  lines: Array<{ ingredient_name: string; amount_oz: number; scaled_amount_oz: number; ingredient_id?: string }>;
};

export async function previewBatch(
  polishId: string,
  batchSizeOz: number = DEFAULT_BATCH_OZ
): Promise<PreviewBatchResult> {
  const detail = await getPolishDetail(polishId);
  if (!detail) throw new Error("Polish not found");
  if (detail.lines.length === 0) throw new Error("Polish has no formula — add a recipe first");

  // Eligibility gate only when ingredient_id is linked.
  for (const line of detail.lines) {
    if (!line.ingredient_id) continue;
    const ing = await getIngredientById(line.ingredient_id);
    if (!ing) continue;
    const check = assertIngredientUsableInProduction(ing.lifecycle_status, ing.name);
    if (!check.ok) throw new Error(check.reason);
  }

  const formulaLines = detail.lines.map((l) => ({
    ingredient_name: l.ingredient_name,
    amount_oz: l.amount_oz,
    ingredient_id: l.ingredient_id,
  }));
  const scaled = scaleFormula(formulaLines, batchSizeOz);

  return {
    polish_id: polishId,
    polish_name: detail.polish.name,
    formula_version: detail.polish.formula_version,
    batch_size_oz: batchSizeOz,
    base_total_oz: formulaBaseTotalOz(formulaLines),
    lines: scaled.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      scaled_amount_oz: l.scaled_amount_oz,
      ingredient_id: l.ingredient_id ?? undefined,
    })),
  };
}

export type CreateBatchInput = {
  polish_id: string;
  release_id?: string | null;
  batch_size_oz?: number;
  planned_date?: string | null;
  notes?: string | null;
  /** When true, create as completed immediately. */
  complete_now?: boolean;
  release_polish_id?: string | null;
};

export async function createProductionBatch(input: CreateBatchInput): Promise<ProductionBatch> {
  const batchSize = input.batch_size_oz ?? DEFAULT_BATCH_OZ;
  const preview = await previewBatch(input.polish_id, batchSize);
  const snap = snapshotFormula(
    preview.lines.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      ingredient_id: l.ingredient_id,
    }))
  );

  const supabase = await resolveWriteClient();
  const status: ProductionBatchStatus = input.complete_now ? "completed" : "planned";
  const { data, error } = await supabase
    .from("production_batches")
    .insert({
      polish_id: input.polish_id,
      release_id: input.release_id ?? null,
      batch_size_oz: batchSize,
      status,
      planned_date: input.planned_date ?? null,
      completed_at: input.complete_now ? new Date().toISOString() : null,
      formula_version: preview.formula_version,
      formula_snapshot: snap,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.complete_now && input.release_polish_id) {
    await updateReleasePolishStatus(input.release_polish_id, "complete");
  } else if (input.release_polish_id) {
    await updateReleasePolishStatus(input.release_polish_id, "batched");
  }

  return mapBatch(data as Record<string, unknown>);
}

export async function completeProductionBatch(
  batchId: string,
  releasePolishId?: string | null
): Promise<ProductionBatch> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("production_batches")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", batchId)
    .select()
    .single();
  if (error) throw error;
  if (releasePolishId) {
    await updateReleasePolishStatus(releasePolishId, "complete");
  }
  return mapBatch(data as Record<string, unknown>);
}

export async function getProductionBatch(id: string): Promise<ProductionBatch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("production_batches").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapBatch(data as Record<string, unknown>) : null;
}
