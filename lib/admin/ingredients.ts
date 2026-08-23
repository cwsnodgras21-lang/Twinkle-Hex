/**
 * Ingredients — Supabase data layer.
 *
 * One table, one section, for everything that goes INTO a polish recipe:
 * raw ingredients, pigments, and supplies. `category` tells them apart;
 * MSDS/SDS sheets (mainly relevant to pigments) attach to any row.
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type {
  Ingredient,
  IngredientCategory,
  IngredientLifecycleStatus,
  IngredientMsdsDocument,
} from "@/types/admin";

export const MSDS_BUCKET = "msds-sheets";
export const MSDS_MAX_BYTES = 10 * 1024 * 1024;

function getWriteClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
}

async function resolveWriteClient() {
  const client = getWriteClient();
  return client instanceof Promise ? await client : client;
}

function mapRow(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    name: row.name as string,
    category: ((row.category as string) || "ingredient") as IngredientCategory,
    lifecycle_status: ((row.lifecycle_status as string) || "tracked") as IngredientLifecycleStatus,
    sku: (row.sku as string) ?? undefined,
    supplier: (row.supplier as string) ?? undefined,
    supplier_identifier: (row.supplier_identifier as string) ?? undefined,
    color_description: (row.color_description as string) ?? undefined,
    received_date: (row.received_date as string) ?? undefined,
    lot_number: (row.lot_number as string) ?? undefined,
    unit: (row.unit as string) ?? "g",
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

function mapMsdsRow(row: Record<string, unknown>): IngredientMsdsDocument {
  return {
    id: row.id as string,
    ingredient_id: row.ingredient_id as string,
    file_name: row.file_name as string,
    storage_path: row.storage_path as string,
    file_size: row.file_size != null ? Number(row.file_size) : undefined,
    mime_type: (row.mime_type as string) ?? "application/pdf",
    notes: (row.notes as string) ?? undefined,
    uploaded_at: row.uploaded_at as string,
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export async function listIngredients(category?: IngredientCategory): Promise<Ingredient[]> {
  const supabase = await createClient();
  let query = supabase.from("ingredients").select("*").order("name", { ascending: true });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ingredients").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function createIngredient(
  data: Omit<Ingredient, "id" | "created_at" | "updated_at">
): Promise<Ingredient> {
  const supabase = await resolveWriteClient();
  const { data: row, error } = await supabase
    .from("ingredients")
    .insert({
      name: data.name,
      category: data.category ?? "ingredient",
      lifecycle_status: data.lifecycle_status ?? "tracked",
      sku: data.sku ?? null,
      supplier: data.supplier ?? null,
      supplier_identifier: data.supplier_identifier ?? null,
      color_description: data.color_description ?? null,
      received_date: data.received_date ?? null,
      lot_number: data.lot_number ?? null,
      unit: data.unit ?? "g",
      quantity_on_hand: data.quantity_on_hand ?? 0,
      low_stock_threshold: data.reorder_point ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export type UpdateIngredientInput = Partial<
  Omit<
    Ingredient,
    | "sku"
    | "supplier"
    | "supplier_identifier"
    | "color_description"
    | "notes"
    | "reorder_point"
    | "received_date"
    | "lot_number"
  >
> & {
  sku?: string | null;
  supplier?: string | null;
  supplier_identifier?: string | null;
  color_description?: string | null;
  notes?: string | null;
  reorder_point?: number | null;
  received_date?: string | null;
  lot_number?: string | null;
};

export async function updateIngredient(id: string, data: UpdateIngredientInput): Promise<Ingredient> {
  const supabase = await resolveWriteClient();
  const { data: row, error } = await supabase
    .from("ingredients")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.lifecycle_status !== undefined && { lifecycle_status: data.lifecycle_status }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.supplier !== undefined && { supplier: data.supplier }),
      ...(data.supplier_identifier !== undefined && { supplier_identifier: data.supplier_identifier }),
      ...(data.color_description !== undefined && { color_description: data.color_description }),
      ...(data.received_date !== undefined && { received_date: data.received_date }),
      ...(data.lot_number !== undefined && { lot_number: data.lot_number }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.quantity_on_hand !== undefined && { quantity_on_hand: data.quantity_on_hand }),
      ...(data.reorder_point !== undefined && { low_stock_threshold: data.reorder_point }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(row as Record<string, unknown>);
}

export async function deleteIngredient(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const documents = await listIngredientMsdsDocuments(id);
  for (const doc of documents) {
    await deleteIngredientMsdsDocument(doc.id);
  }
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}

// --- MSDS / SDS documents (mainly for pigments) ---

export async function listIngredientMsdsDocuments(ingredientId: string): Promise<IngredientMsdsDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient_msds_documents")
    .select("*")
    .eq("ingredient_id", ingredientId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMsdsRow(row as Record<string, unknown>));
}

export async function uploadIngredientMsdsDocument(
  ingredientId: string,
  file: File,
  notes?: string
): Promise<IngredientMsdsDocument> {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed for MSDS sheets");
  }
  if (file.size > MSDS_MAX_BYTES) {
    throw new Error("MSDS file must be 10 MB or smaller");
  }

  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) throw new Error("Ingredient not found");

  const supabase = await resolveWriteClient();
  const documentId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name || "msds.pdf");
  const storagePath = `${ingredientId}/${documentId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MSDS_BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) throw uploadError;

  const { data: row, error: insertError } = await supabase
    .from("ingredient_msds_documents")
    .insert({
      id: documentId,
      ingredient_id: ingredientId,
      file_name: safeName,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: "application/pdf",
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(MSDS_BUCKET).remove([storagePath]);
    throw insertError;
  }

  return mapMsdsRow(row as Record<string, unknown>);
}

export async function deleteIngredientMsdsDocument(documentId: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("ingredient_msds_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return;
    throw error;
  }

  const doc = mapMsdsRow(data as Record<string, unknown>);
  await supabase.storage.from(MSDS_BUCKET).remove([doc.storage_path]);

  const { error: deleteError } = await supabase
    .from("ingredient_msds_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) throw deleteError;
}

export async function getIngredientMsdsSignedUrl(
  documentId: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("ingredient_msds_documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") throw new Error("MSDS document not found");
    throw error;
  }

  const storagePath = (data as { storage_path: string }).storage_path;
  const { data: signed, error: signError } = await supabase.storage
    .from(MSDS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (signError) throw signError;
  if (!signed?.signedUrl) throw new Error("Could not generate download link");

  return signed.signedUrl;
}

export async function countIngredientMsdsDocuments(ingredientIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ingredientIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient_msds_documents")
    .select("ingredient_id")
    .in("ingredient_id", ingredientIds);

  if (error) throw error;

  for (const id of ingredientIds) counts.set(id, 0);
  for (const row of data ?? []) {
    const ingredientId = (row as { ingredient_id: string }).ingredient_id;
    counts.set(ingredientId, (counts.get(ingredientId) ?? 0) + 1);
  }

  return counts;
}
