/**
 * Finished stock — Supabase data layer.
 *
 * Optionally links back to the polish/recipe that made it, so Stock isn't an
 * island — you can see what a bottle actually is at a glance.
 */

import { resolveDataClient, resolveWriteClient } from "@/lib/admin/supabase-write";
import type { FinishedInventoryItem } from "@/types/admin";

function mapRow(row: Record<string, unknown>): FinishedInventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? undefined,
    polish_id: (row.polish_id as string) ?? undefined,
    quantity_on_hand: Number(row.quantity_on_hand ?? 0),
    reserved_quantity: Number(row.reserved_quantity ?? 0),
    location: (row.location as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listFinishedInventoryItems(): Promise<FinishedInventoryItem[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export type FinishedInventoryItemWithPolish = FinishedInventoryItem & {
  polish_name?: string;
  polish_color_hex?: string;
};

/** Stock list joined with the polish it's made from, for the "what is this bottle" glance. */
export async function listFinishedInventoryItemsWithPolish(): Promise<FinishedInventoryItemWithPolish[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .select("*, polishes ( name, color_hex )")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const base = mapRow(row);
    const polish = row.polishes as { name?: string; color_hex?: string } | null;
    return {
      ...base,
      polish_name: polish?.name ?? undefined,
      polish_color_hex: polish?.color_hex ?? undefined,
    };
  });
}

export type CreateFinishedInventoryItemInput = Omit<
  FinishedInventoryItem,
  "id" | "created_at" | "updated_at"
>;

export async function createFinishedInventoryItem(
  input: CreateFinishedInventoryItemInput
): Promise<FinishedInventoryItem> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .insert({
      name: input.name,
      sku: input.sku ?? null,
      polish_id: input.polish_id ?? null,
      quantity_on_hand: input.quantity_on_hand,
      reserved_quantity: input.reserved_quantity,
      location: input.location ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export type UpdateFinishedInventoryItemInput = Partial<CreateFinishedInventoryItemInput>;

export async function updateFinishedInventoryItem(
  id: string,
  input: UpdateFinishedInventoryItemInput
): Promise<FinishedInventoryItem> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("finished_inventory_items")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.polish_id !== undefined && { polish_id: input.polish_id }),
      ...(input.quantity_on_hand !== undefined && { quantity_on_hand: input.quantity_on_hand }),
      ...(input.reserved_quantity !== undefined && { reserved_quantity: input.reserved_quantity }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteFinishedInventoryItem(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("finished_inventory_items").delete().eq("id", id);
  if (error) throw error;
}
