/**
 * Supplies CRUD - Supabase data layer.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Supply } from "@/types/admin";

function mapRow(row: Record<string, unknown>): Supply {
  return {
    id: row.id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? undefined,
    category: (row.category as string) ?? undefined,
    unit: (row.unit as string) ?? "each",
    quantity_on_hand: Number(row.quantity_on_hand ?? 0),
    reorder_point:
      row.reorder_point != null
        ? Number(row.reorder_point)
        : row.low_stock_threshold != null
          ? Number(row.low_stock_threshold)
          : undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listSupplies(): Promise<Supply[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getSupplyById(id: string): Promise<Supply | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createSupply(
  data: Omit<Supply, "id" | "created_at" | "updated_at">
): Promise<Supply> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("supplies")
    .insert({
      name: data.name,
      sku: data.sku ?? null,
      category: data.category ?? null,
      unit: data.unit ?? "each",
      quantity_on_hand: data.quantity_on_hand ?? 0,
      low_stock_threshold: data.reorder_point ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export type UpdateSupplyInput = Partial<Omit<Supply, "sku" | "category" | "notes" | "reorder_point">> & {
  sku?: string | null;
  category?: string | null;
  notes?: string | null;
  reorder_point?: number | null;
};

export async function updateSupply(id: string, data: UpdateSupplyInput): Promise<Supply> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { data: row, error } = await supabase
    .from("supplies")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.quantity_on_hand !== undefined && { quantity_on_hand: data.quantity_on_hand }),
      ...(data.reorder_point !== undefined && {
        low_stock_threshold: data.reorder_point,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export async function deleteSupply(id: string): Promise<void> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();
  const { error } = await supabase.from("supplies").delete().eq("id", id);
  if (error) throw error;
}
