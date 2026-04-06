/**
 * Release polishes + recipe lines — Supabase data layer.
 */

import { createClient } from "@/supabase/server";
import type { PolishRecipeLine, ReleasePolish } from "@/types/admin";
import { getReleaseById } from "./releases";
import type { Release } from "@/types/admin";

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapPolishRow(row: Record<string, unknown>): ReleasePolish {
  return {
    id: row.id as string,
    release_id: row.release_id as string,
    name: row.name as string,
    sort_order: num(row.sort_order),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLineRow(row: Record<string, unknown>): PolishRecipeLine {
  return {
    id: row.id as string,
    polish_id: row.polish_id as string,
    sort_order: num(row.sort_order),
    ingredient_name: row.ingredient_name as string,
    amount_oz: num(row.amount_oz),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listPolishesForRelease(releaseId: string): Promise<ReleasePolish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .select("*")
    .eq("release_id", releaseId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPolishRow(row as Record<string, unknown>));
}

/** Polish row with parent release labels for admin index */
export type ReleasePolishListItem = ReleasePolish & {
  release_name: string;
  release_collection?: string;
};

/**
 * All polishes across releases (for /admin/polishes).
 */
export async function listAllPolishesWithRelease(): Promise<ReleasePolishListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .select(
      `
      *,
      releases (
        name,
        collection
      )
    `
    )
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapPolishRow(row);
    const rel = row.releases as { name?: string; collection?: string | null } | null;
    return {
      ...base,
      release_name: rel?.name?.trim() || "—",
      release_collection: rel?.collection?.trim() || undefined,
    };
  });
}

export type PolishDetail = {
  polish: ReleasePolish;
  release: Release;
  lines: PolishRecipeLine[];
};

/**
 * Load polish, its parent release, and recipe lines. Returns null if polish missing
 * or release_id does not match expectedReleaseId (when provided).
 */
export async function getPolishDetail(
  polishId: string,
  expectedReleaseId?: string
): Promise<PolishDetail | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("release_polishes")
    .select("*")
    .eq("id", polishId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!row) return null;

  const polish = mapPolishRow(row as Record<string, unknown>);
  if (expectedReleaseId !== undefined && polish.release_id !== expectedReleaseId) {
    return null;
  }

  const release = await getReleaseById(polish.release_id);
  if (!release) return null;

  const { data: lineRows, error: linesError } = await supabase
    .from("polish_recipe_lines")
    .select("*")
    .eq("polish_id", polishId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (linesError) throw linesError;

  return {
    polish,
    release,
    lines: (lineRows ?? []).map((r) => mapLineRow(r as Record<string, unknown>)),
  };
}

export async function getPolishById(id: string): Promise<ReleasePolish | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("release_polishes").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapPolishRow(data as Record<string, unknown>) : null;
}

export async function createReleasePolish(
  releaseId: string,
  input: { name: string; sort_order?: number }
): Promise<ReleasePolish> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("release_polishes")
    .insert({
      release_id: releaseId,
      name: input.name.trim(),
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPolishRow(data as Record<string, unknown>);
}

export async function updateReleasePolish(
  id: string,
  input: { name?: string; sort_order?: number }
): Promise<ReleasePolish> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("release_polishes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapPolishRow(data as Record<string, unknown>);
}

export async function deleteReleasePolish(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("release_polishes").delete().eq("id", id);
  if (error) throw error;
}

async function nextRecipeLineSortOrder(polishId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polish_recipe_lines")
    .select("sort_order")
    .eq("polish_id", polishId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order != null ? num(data.sort_order) : -1) + 1;
}

export async function createRecipeLine(
  polishId: string,
  input: { ingredient_name: string; amount_oz: number; sort_order?: number }
): Promise<PolishRecipeLine> {
  const supabase = await createClient();
  const sort_order =
    input.sort_order !== undefined ? input.sort_order : await nextRecipeLineSortOrder(polishId);

  const { data, error } = await supabase
    .from("polish_recipe_lines")
    .insert({
      polish_id: polishId,
      ingredient_name: input.ingredient_name.trim(),
      amount_oz: input.amount_oz,
      sort_order,
    })
    .select()
    .single();

  if (error) throw error;
  return mapLineRow(data as Record<string, unknown>);
}

export async function updateRecipeLine(
  id: string,
  input: { ingredient_name?: string; amount_oz?: number; sort_order?: number }
): Promise<PolishRecipeLine> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.ingredient_name !== undefined) patch.ingredient_name = input.ingredient_name.trim();
  if (input.amount_oz !== undefined) patch.amount_oz = input.amount_oz;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("polish_recipe_lines")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapLineRow(data as Record<string, unknown>);
}

export async function deleteRecipeLine(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("polish_recipe_lines").delete().eq("id", id);
  if (error) throw error;
}

export type RecipeLineInput = { ingredient_name: string; amount_oz: number };

/**
 * Replace all recipe lines for a polish. Prefers RPC (atomic); falls back to delete+insert
 * if the migration has not been applied yet.
 */
export async function replacePolishRecipeLines(
  polishId: string,
  lines: RecipeLineInput[]
): Promise<void> {
  const supabase = await createClient();
  const payload = lines.map((l) => ({
    ingredient_name: l.ingredient_name.trim(),
    amount_oz: l.amount_oz,
  }));

  const { error } = await supabase.rpc("replace_polish_recipe_lines", {
    p_polish_id: polishId,
    p_lines: payload,
  });

  if (!error) return;

  const useFallback =
    error.code === "PGRST202" ||
    error.code === "42883" ||
    (typeof error.message === "string" &&
      error.message.toLowerCase().includes("replace_polish_recipe_lines"));

  if (!useFallback) throw error;

  const { error: delErr } = await supabase
    .from("polish_recipe_lines")
    .delete()
    .eq("polish_id", polishId);
  if (delErr) throw delErr;

  if (payload.length === 0) return;

  const rows = payload.map((l, i) => ({
    polish_id: polishId,
    sort_order: i,
    ingredient_name: l.ingredient_name,
    amount_oz: l.amount_oz,
  }));
  const { error: insErr } = await supabase.from("polish_recipe_lines").insert(rows);
  if (insErr) throw insErr;
}
