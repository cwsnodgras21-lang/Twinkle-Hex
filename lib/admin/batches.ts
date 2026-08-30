/**
 * Production batches — execution history with immutable formula snapshots,
 * oz + bottles tracking, lot numbers, and one-shot inventory consumption.
 */

import { resolveWriteClient, resolveDataClient, num } from "@/lib/admin/supabase-write";
import { getPolishDetail } from "@/lib/admin/polishes";
import { getIngredientById, listIngredients } from "@/lib/admin/ingredients";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import { getPackagingBomForPolish } from "@/lib/admin/packaging";
import {
  DEFAULT_BATCH_OZ,
  scaleFormula,
  snapshotFormula,
  formulaBaseTotalOz,
} from "@/lib/ops/formula-scaling";
import { computeBulkRemaining, DEFAULT_FILL_OZ_PER_BOTTLE } from "@/lib/ops/batch-yield";
import { estimateBottleCost, resolveUnitCost } from "@/lib/ops/bottle-cost";
import { assertIngredientUsableInProduction } from "@/lib/ops/release-risk";
import { updateReleasePolishStatus } from "@/lib/admin/releases";
import type { FormulaSnapshotLine, ProductionBatch, ProductionBatchStatus } from "@/types/admin";

function mapBatch(row: Record<string, unknown>): ProductionBatch {
  const snap = row.formula_snapshot;
  const formula_snapshot: FormulaSnapshotLine[] = Array.isArray(snap)
    ? (snap as FormulaSnapshotLine[])
    : [];
  const batch_size_oz = num(row.batch_size_oz, DEFAULT_BATCH_OZ);
  return {
    id: row.id as string,
    polish_id: row.polish_id as string,
    release_id: (row.release_id as string) ?? undefined,
    batch_size_oz,
    total_bulk_oz: num(row.total_bulk_oz, batch_size_oz),
    bottles_filled: num(row.bottles_filled, 0),
    fill_oz_per_bottle:
      row.fill_oz_per_bottle != null ? num(row.fill_oz_per_bottle) : undefined,
    ounces_used_for_bottles:
      row.ounces_used_for_bottles != null ? num(row.ounces_used_for_bottles) : undefined,
    bulk_remaining_oz:
      row.bulk_remaining_oz != null ? num(row.bulk_remaining_oz) : undefined,
    lot_number: (row.lot_number as string) ?? undefined,
    status: (row.status as ProductionBatchStatus) ?? "planned",
    planned_date: (row.planned_date as string) ?? undefined,
    completed_at: (row.completed_at as string) ?? undefined,
    formula_version: num(row.formula_version, 1),
    formula_snapshot,
    inventory_consumed_at: (row.inventory_consumed_at as string) ?? undefined,
    estimated_cost_per_bottle:
      row.estimated_cost_per_bottle != null ? num(row.estimated_cost_per_bottle) : undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function allocateLotNumber(): Promise<string> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase.rpc("allocate_production_lot_number");
  if (error) throw error;
  if (!data || typeof data !== "string") throw new Error("Failed to allocate lot number");
  return data;
}

export async function listBatchesForPolish(polishId: string): Promise<ProductionBatch[]> {
  const supabase = await resolveDataClient();
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
  const supabase = await resolveDataClient();
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

export async function searchBatchesByLot(query: string): Promise<
  Array<ProductionBatch & { polish_name?: string }>
> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("production_batches")
    .select("*, polishes ( name )")
    .ilike("lot_number", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(40);
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
  lines: Array<{
    ingredient_name: string;
    amount_oz: number;
    scaled_amount_oz: number;
    ingredient_id?: string;
  }>;
  estimated_cost_per_bottle?: number;
};

export async function previewBatch(
  polishId: string,
  batchSizeOz: number = DEFAULT_BATCH_OZ
): Promise<PreviewBatchResult> {
  const detail = await getPolishDetail(polishId);
  if (!detail) throw new Error("Polish not found");
  if (detail.lines.length === 0) throw new Error("Polish has no formula — add a recipe first");

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
  const cost = await estimateCostForPolish(polishId, batchSizeOz);

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
    estimated_cost_per_bottle: cost?.total_per_bottle,
  };
}

async function estimateCostForPolish(polishId: string, batchSizeOz: number) {
  const settings = await getOpsSettings();
  const fill = settings.default_fill_oz_per_bottle || DEFAULT_FILL_OZ_PER_BOTTLE;
  const detail = await getPolishDetail(polishId);
  if (!detail || detail.lines.length === 0) return null;

  const ingredients = await listIngredients();
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const scaledToFill = scaleFormula(
    detail.lines.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      ingredient_id: l.ingredient_id,
    })),
    fill
  );

  const formulaLinesForOneBottle = scaledToFill.map((l) => {
    const ing = l.ingredient_id ? byId.get(l.ingredient_id) : undefined;
    return {
      ingredient_id: l.ingredient_id,
      ingredient_name: l.ingredient_name,
      amount: l.scaled_amount_oz,
      unit_cost: ing
        ? resolveUnitCost({
            unit_cost: ing.unit_cost,
            purchase_cost: ing.purchase_cost,
            purchase_quantity: ing.purchase_quantity,
          })
        : null,
      category: ing?.category,
    };
  });

  const bom = await getPackagingBomForPolish(polishId);
  const packagingLines = (bom?.lines ?? []).map((line) => {
    const ing = byId.get(line.ingredient_id);
    return {
      ingredient_id: line.ingredient_id,
      name: ing?.name,
      quantity_per_bottle: line.quantity_per_bottle,
      unit_cost: ing
        ? resolveUnitCost({
            unit_cost: ing.unit_cost,
            purchase_cost: ing.purchase_cost,
            purchase_quantity: ing.purchase_quantity,
          })
        : null,
    };
  });

  void batchSizeOz;
  return estimateBottleCost({ formulaLinesForOneBottle, packagingLines });
}

export type CreateBatchInput = {
  polish_id: string;
  release_id?: string | null;
  batch_size_oz?: number;
  total_bulk_oz?: number;
  bottles_filled?: number;
  fill_oz_per_bottle?: number | null;
  ounces_used_for_bottles?: number | null;
  planned_date?: string | null;
  notes?: string | null;
  /** When true, create as completed immediately and consume inventory. */
  complete_now?: boolean;
  release_polish_id?: string | null;
  /** Consume inventory when completing (default true when complete_now). */
  consume_inventory?: boolean;
};

export async function createProductionBatch(input: CreateBatchInput): Promise<ProductionBatch> {
  const settings = await getOpsSettings();
  const batchSize = input.batch_size_oz ?? settings.default_batch_oz ?? DEFAULT_BATCH_OZ;
  const totalBulk = input.total_bulk_oz ?? batchSize;
  const bottles = input.bottles_filled ?? 0;
  const fill =
    input.fill_oz_per_bottle ?? settings.default_fill_oz_per_bottle ?? DEFAULT_FILL_OZ_PER_BOTTLE;

  const yieldMath = computeBulkRemaining({
    total_bulk_oz: totalBulk,
    bottles_filled: bottles,
    fill_oz_per_bottle: fill,
    ounces_used_for_bottles: input.ounces_used_for_bottles,
  });

  const preview = await previewBatch(input.polish_id, totalBulk);
  const snap = snapshotFormula(
    preview.lines.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      ingredient_id: l.ingredient_id,
    }))
  );

  const lotNumber = await allocateLotNumber();
  const cost = await estimateCostForPolish(input.polish_id, totalBulk);

  const supabase = await resolveWriteClient();
  const status: ProductionBatchStatus = input.complete_now ? "completed" : "planned";
  const { data, error } = await supabase
    .from("production_batches")
    .insert({
      polish_id: input.polish_id,
      release_id: input.release_id ?? null,
      batch_size_oz: batchSize,
      total_bulk_oz: yieldMath.total_bulk_oz,
      bottles_filled: yieldMath.bottles_filled,
      fill_oz_per_bottle: yieldMath.fill_oz_per_bottle,
      ounces_used_for_bottles: yieldMath.ounces_used_for_bottles,
      bulk_remaining_oz: yieldMath.bulk_remaining_oz,
      lot_number: lotNumber,
      status,
      planned_date: input.planned_date ?? null,
      completed_at: input.complete_now ? new Date().toISOString() : null,
      formula_version: preview.formula_version,
      formula_snapshot: snap,
      estimated_cost_per_bottle: cost?.total_per_bottle ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const batch = mapBatch(data as Record<string, unknown>);

  if (input.complete_now && input.consume_inventory !== false) {
    await applyInventoryForBatch(batch.id);
  }

  if (input.complete_now && input.release_polish_id) {
    await updateReleasePolishStatus(input.release_polish_id, "complete");
  } else if (input.release_polish_id) {
    await updateReleasePolishStatus(input.release_polish_id, "batched");
  }

  return (await getProductionBatch(batch.id)) ?? batch;
}

export async function completeProductionBatch(
  batchId: string,
  opts?: {
    releasePolishId?: string | null;
    bottles_filled?: number;
    total_bulk_oz?: number;
    fill_oz_per_bottle?: number | null;
    ounces_used_for_bottles?: number | null;
    consume_inventory?: boolean;
  }
): Promise<ProductionBatch> {
  const existing = await getProductionBatch(batchId);
  if (!existing) throw new Error("Batch not found");

  const settings = await getOpsSettings();
  const bottles = opts?.bottles_filled ?? existing.bottles_filled;
  const totalBulk = opts?.total_bulk_oz ?? existing.total_bulk_oz;
  const fill =
    opts?.fill_oz_per_bottle ??
    existing.fill_oz_per_bottle ??
    settings.default_fill_oz_per_bottle ??
    DEFAULT_FILL_OZ_PER_BOTTLE;
  const yieldMath = computeBulkRemaining({
    total_bulk_oz: totalBulk,
    bottles_filled: bottles,
    fill_oz_per_bottle: fill,
    ounces_used_for_bottles: opts?.ounces_used_for_bottles ?? existing.ounces_used_for_bottles,
  });

  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("production_batches")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_bulk_oz: yieldMath.total_bulk_oz,
      bottles_filled: yieldMath.bottles_filled,
      fill_oz_per_bottle: yieldMath.fill_oz_per_bottle,
      ounces_used_for_bottles: yieldMath.ounces_used_for_bottles,
      bulk_remaining_oz: yieldMath.bulk_remaining_oz,
      batch_size_oz: yieldMath.total_bulk_oz,
    })
    .eq("id", batchId)
    .select()
    .single();
  if (error) throw error;

  if (opts?.consume_inventory !== false) {
    await applyInventoryForBatch(batchId);
  }

  if (opts?.releasePolishId) {
    await updateReleasePolishStatus(opts.releasePolishId, "complete");
  }

  return (await getProductionBatch(batchId)) ?? mapBatch(data as Record<string, unknown>);
}

/**
 * Apply ingredient + packaging decrements and finished-bottle increase once.
 * Safe to call repeatedly — RPC refuses if inventory_consumed_at is set.
 */
export async function applyInventoryForBatch(batchId: string): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.inventory_consumed_at) return;
  if (batch.bottles_filled <= 0 && batch.total_bulk_oz <= 0) return;

  const detail = await getPolishDetail(batch.polish_id);
  const polishName = detail?.polish.name ?? "Finished polish";

  // Scale formula to total bulk produced (ingredient consumption for the batch)
  const scaled = scaleFormula(
    batch.formula_snapshot.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      ingredient_id: l.ingredient_id,
    })),
    batch.total_bulk_oz
  );

  const ingredientDecrements = scaled
    .filter((l) => l.ingredient_id && l.scaled_amount_oz > 0)
    .map((l) => ({
      ingredient_id: l.ingredient_id!,
      quantity: l.scaled_amount_oz,
      notes: l.ingredient_name,
    }));

  const bom = await getPackagingBomForPolish(batch.polish_id);
  const packagingDecrements = (bom?.lines ?? [])
    .filter((line) => batch.bottles_filled > 0)
    .map((line) => ({
      ingredient_id: line.ingredient_id,
      quantity: line.quantity_per_bottle * batch.bottles_filled,
      notes: "packaging",
    }));

  const supabase = await resolveWriteClient();
  const { error } = await supabase.rpc("apply_production_batch_inventory", {
    p_batch_id: batchId,
    p_ingredient_decrements: ingredientDecrements,
    p_packaging_decrements: packagingDecrements,
    p_finished_delta: batch.bottles_filled,
    p_polish_id: batch.polish_id,
    p_polish_name: polishName,
  });
  if (error) throw error;
}

export async function updateProductionBatchYield(
  batchId: string,
  input: {
    total_bulk_oz?: number;
    bottles_filled?: number;
    fill_oz_per_bottle?: number | null;
    ounces_used_for_bottles?: number | null;
    notes?: string | null;
  }
): Promise<ProductionBatch> {
  const existing = await getProductionBatch(batchId);
  if (!existing) throw new Error("Batch not found");
  if (existing.inventory_consumed_at) {
    throw new Error("Cannot edit yield after inventory has been consumed — create a new batch instead");
  }

  const settings = await getOpsSettings();
  const yieldMath = computeBulkRemaining({
    total_bulk_oz: input.total_bulk_oz ?? existing.total_bulk_oz,
    bottles_filled: input.bottles_filled ?? existing.bottles_filled,
    fill_oz_per_bottle:
      input.fill_oz_per_bottle ??
      existing.fill_oz_per_bottle ??
      settings.default_fill_oz_per_bottle,
    ounces_used_for_bottles: input.ounces_used_for_bottles ?? existing.ounces_used_for_bottles,
  });

  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("production_batches")
    .update({
      total_bulk_oz: yieldMath.total_bulk_oz,
      bottles_filled: yieldMath.bottles_filled,
      fill_oz_per_bottle: yieldMath.fill_oz_per_bottle,
      ounces_used_for_bottles: yieldMath.ounces_used_for_bottles,
      bulk_remaining_oz: yieldMath.bulk_remaining_oz,
      batch_size_oz: yieldMath.total_bulk_oz,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .eq("id", batchId)
    .select()
    .single();
  if (error) throw error;
  return mapBatch(data as Record<string, unknown>);
}

export async function getProductionBatch(id: string): Promise<ProductionBatch | null> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase.from("production_batches").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapBatch(data as Record<string, unknown>) : null;
}

/** Unfinished bulk across completed/in-progress batches (remaining > 0). */
export async function listUnfinishedBulk(limit = 40): Promise<
  Array<ProductionBatch & { polish_name?: string }>
> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("production_batches")
    .select("*, polishes ( name )")
    .gt("bulk_remaining_oz", 0)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapBatch(row);
    const polish = row.polishes as { name?: string } | null;
    return { ...base, polish_name: polish?.name };
  });
}
