/**
 * Finished-bottle packaging BOM — supplies consumed per bottle.
 * Packaging is NOT part of polish formulas.
 */

import { resolveWriteClient, resolveDataClient, num } from "@/lib/admin/supabase-write";
import type { PackagingBom, PackagingBomLine } from "@/types/admin";

function mapBom(row: Record<string, unknown>): PackagingBom {
  return {
    id: row.id as string,
    name: row.name as string,
    polish_id: (row.polish_id as string) ?? undefined,
    is_default: Boolean(row.is_default),
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLine(row: Record<string, unknown>): PackagingBomLine {
  return {
    id: row.id as string,
    packaging_bom_id: row.packaging_bom_id as string,
    ingredient_id: row.ingredient_id as string,
    quantity_per_bottle: num(row.quantity_per_bottle, 1),
    sort_order: num(row.sort_order),
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export type PackagingBomWithLines = PackagingBom & {
  lines: Array<PackagingBomLine & { ingredient_name?: string; quantity_on_hand?: number }>;
};

export async function listPackagingBoms(): Promise<PackagingBom[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("packaging_boms")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapBom(r as Record<string, unknown>));
}

export async function getPackagingBom(id: string): Promise<PackagingBomWithLines | null> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase.from("packaging_boms").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const bom = mapBom(data as Record<string, unknown>);
  const lines = await listBomLines(id);
  return { ...bom, lines };
}

/** Prefer polish-specific default BOM; else global default. */
export async function getPackagingBomForPolish(
  polishId?: string | null
): Promise<PackagingBomWithLines | null> {
  const supabase = await resolveDataClient();

  if (polishId) {
    const { data: polishBom } = await supabase
      .from("packaging_boms")
      .select("*")
      .eq("polish_id", polishId)
      .eq("is_default", true)
      .maybeSingle();
    if (polishBom) {
      const bom = mapBom(polishBom as Record<string, unknown>);
      return { ...bom, lines: await listBomLines(bom.id) };
    }
  }

  const { data: globalBom, error } = await supabase
    .from("packaging_boms")
    .select("*")
    .is("polish_id", null)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw error;
  if (!globalBom) return null;
  const bom = mapBom(globalBom as Record<string, unknown>);
  return { ...bom, lines: await listBomLines(bom.id) };
}

async function listBomLines(
  bomId: string
): Promise<Array<PackagingBomLine & { ingredient_name?: string; quantity_on_hand?: number }>> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("packaging_bom_lines")
    .select("*, ingredients ( name, quantity_on_hand )")
    .eq("packaging_bom_id", bomId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapLine(row);
    const ing = row.ingredients as { name?: string; quantity_on_hand?: number } | null;
    return {
      ...base,
      ingredient_name: ing?.name,
      quantity_on_hand: ing?.quantity_on_hand != null ? Number(ing.quantity_on_hand) : undefined,
    };
  });
}

export async function createPackagingBom(input: {
  name: string;
  polish_id?: string | null;
  is_default?: boolean;
  notes?: string | null;
}): Promise<PackagingBom> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("packaging_boms")
    .insert({
      name: input.name.trim(),
      polish_id: input.polish_id ?? null,
      is_default: input.is_default ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBom(data as Record<string, unknown>);
}

export async function replacePackagingBomLines(
  bomId: string,
  lines: Array<{ ingredient_id: string; quantity_per_bottle: number; notes?: string | null }>
): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error: delError } = await supabase
    .from("packaging_bom_lines")
    .delete()
    .eq("packaging_bom_id", bomId);
  if (delError) throw delError;

  if (lines.length === 0) return;

  const { error } = await supabase.from("packaging_bom_lines").insert(
    lines.map((line, i) => ({
      packaging_bom_id: bomId,
      ingredient_id: line.ingredient_id,
      quantity_per_bottle: line.quantity_per_bottle,
      sort_order: i,
      notes: line.notes ?? null,
    }))
  );
  if (error) throw error;
}

export async function updatePackagingBom(
  id: string,
  input: { name?: string; notes?: string | null; is_default?: boolean }
): Promise<PackagingBom> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("packaging_boms")
    .update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.is_default !== undefined ? { is_default: input.is_default } : {}),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapBom(data as Record<string, unknown>);
}
