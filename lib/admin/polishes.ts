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
