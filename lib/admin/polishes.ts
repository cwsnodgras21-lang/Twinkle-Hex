/**
 * Polishes + recipe lines — Supabase data layer.
 *
 * A polish record IS its recipe: name, swatch color, and the list of
 * ingredient lines (name + amount in ounces) that make it. No separate
 * "release" wrapper — this is the standalone home for "how is X made?".
 */

import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import type { Polish, PolishRecipeLine } from "@/types/admin";

function getWriteClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
}

async function resolveWriteClient() {
  const client = getWriteClient();
  return client instanceof Promise ? await client : client;
}

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapPolishRow(row: Record<string, unknown>): Polish {
  return {
    id: row.id as string,
    name: row.name as string,
    sort_order: num(row.sort_order),
    color_hex: (row.color_hex as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
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

export async function listPolishes(): Promise<Polish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polishes")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPolishRow(row as Record<string, unknown>));
}

export type PolishWithLineCount = Polish & { line_count: number };

/** Polishes for the list view, with a recipe-line count so the table shows "has a recipe yet?" at a glance. */
export async function listPolishesWithLineCount(): Promise<PolishWithLineCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polishes")
    .select("*, polish_recipe_lines(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapPolishRow(row);
    const countRows = row.polish_recipe_lines as { count: number }[] | null;
    return { ...base, line_count: countRows?.[0]?.count ?? 0 };
  });
}

export type PolishDetail = {
  polish: Polish;
  lines: PolishRecipeLine[];
};

export async function getPolishDetail(polishId: string): Promise<PolishDetail | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("polishes")
    .select("*")
    .eq("id", polishId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!row) return null;

  const { data: lineRows, error: linesError } = await supabase
    .from("polish_recipe_lines")
    .select("*")
    .eq("polish_id", polishId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (linesError) throw linesError;

  return {
    polish: mapPolishRow(row as Record<string, unknown>),
    lines: (lineRows ?? []).map((r) => mapLineRow(r as Record<string, unknown>)),
  };
}

export async function getPolishById(id: string): Promise<Polish | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("polishes").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapPolishRow(data as Record<string, unknown>) : null;
}

export type CreatePolishInput = {
  name: string;
  sort_order?: number;
  color_hex?: string | null;
  notes?: string | null;
};

export async function createPolish(input: CreatePolishInput): Promise<Polish> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("polishes")
    .insert({
      name: input.name.trim(),
      sort_order: input.sort_order ?? 0,
      color_hex: input.color_hex ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPolishRow(data as Record<string, unknown>);
}

export type UpdatePolishInput = {
  name?: string;
  sort_order?: number;
  color_hex?: string | null;
  notes?: string | null;
};

export async function updatePolish(id: string, input: UpdatePolishInput): Promise<Polish> {
  const supabase = await resolveWriteClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.color_hex !== undefined) patch.color_hex = input.color_hex;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase.from("polishes").update(patch).eq("id", id).select().single();

  if (error) throw error;
  return mapPolishRow(data as Record<string, unknown>);
}

export async function deletePolish(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("polishes").delete().eq("id", id);
  if (error) throw error;
}

export type RecipeLineInput = { ingredient_name: string; amount_oz: number };

/**
 * Replace all recipe lines for a polish. Prefers RPC (atomic); falls back to delete+insert
 * if the migration has not been applied yet.
 */
export async function replacePolishRecipeLines(polishId: string, lines: RecipeLineInput[]): Promise<void> {
  const supabase = await resolveWriteClient();
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

  const { error: delErr } = await supabase.from("polish_recipe_lines").delete().eq("polish_id", polishId);
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
