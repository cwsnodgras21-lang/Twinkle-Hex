/**
 * Finished inventory items — Supabase data layer.
 */

import { createClient } from "@/supabase/server";
import type { FinishedInventoryItem } from "@/types/admin";

function mapRow(row: Record<string, unknown>): FinishedInventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? undefined,
    release_id: (row.release_id as string) ?? undefined,
    quantity_on_hand: Number(row.quantity_on_hand ?? 0),
    reserved_quantity: Number(row.reserved_quantity ?? 0),
    location: (row.location as string) ?? undefined,
    product_id: (row.product_id as string) ?? undefined,
    variant_id: (row.variant_id as string) ?? undefined,
    batch_id: (row.batch_id as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listFinishedInventoryItems(): Promise<FinishedInventoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export type CreateFinishedInventoryItemInput = Omit<
  FinishedInventoryItem,
  "id" | "created_at" | "updated_at"
>;

export async function createFinishedInventoryItem(
  input: CreateFinishedInventoryItemInput
): Promise<FinishedInventoryItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .insert({
      name: input.name,
      sku: input.sku ?? null,
      release_id: input.release_id ?? null,
      quantity_on_hand: input.quantity_on_hand,
      reserved_quantity: input.reserved_quantity,
      location: input.location ?? null,
      product_id: input.product_id ?? null,
      variant_id: input.variant_id ?? null,
      batch_id: input.batch_id ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}
