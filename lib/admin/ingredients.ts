/**
 * Ingredients CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Ingredient } from "@/types/admin";

function mapRow(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? undefined,
    supplier: (row.supplier as string) ?? undefined,
    unit: (row.unit as string) ?? "g",
    quantity_on_hand: Number(row.quantity_on_hand ?? 0),
    reorder_point: row.reorder_point != null ? Number(row.reorder_point) : undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createIngredient(
  data: Omit<Ingredient, "id" | "created_at" | "updated_at">
): Promise<Ingredient> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("ingredients")
    .insert({
      name: data.name,
      sku: data.sku ?? null,
      supplier: data.supplier ?? null,
      unit: data.unit ?? "g",
      quantity_on_hand: data.quantity_on_hand ?? 0,
      reorder_point: data.reorder_point ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export type UpdateIngredientInput = Partial<Omit<Ingredient, "sku" | "supplier" | "notes" | "reorder_point">> & {
  sku?: string | null;
  supplier?: string | null;
  notes?: string | null;
  reorder_point?: number | null;
};

export async function updateIngredient(
  id: string,
  data: UpdateIngredientInput
): Promise<Ingredient> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("ingredients")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.supplier !== undefined && { supplier: data.supplier }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.quantity_on_hand !== undefined && { quantity_on_hand: data.quantity_on_hand }),
      ...(data.reorder_point !== undefined && { reorder_point: data.reorder_point }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export async function deleteIngredient(id: string): Promise<void> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}
