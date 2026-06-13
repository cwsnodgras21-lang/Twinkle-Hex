/**
 * Pigments CRUD + MSDS document attachments (Supabase Storage).
 */

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import type { Pigment, PigmentMsdsDocument } from "@/types/admin";

export const MSDS_BUCKET = "msds-sheets";
export const MSDS_MAX_BYTES = 10 * 1024 * 1024;

function getWriteClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : createClient();
}

async function resolveWriteClient() {
  const client = getWriteClient();
  return client instanceof Promise ? await client : client;
}

function mapPigmentRow(row: Record<string, unknown>): Pigment {
  return {
    id: row.id as string,
    name: row.name as string,
    sku: (row.sku as string) ?? undefined,
    supplier: (row.supplier as string) ?? undefined,
    color_description: (row.color_description as string) ?? undefined,
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

function mapMsdsRow(row: Record<string, unknown>): PigmentMsdsDocument {
  return {
    id: row.id as string,
    pigment_id: row.pigment_id as string,
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

export async function listPigments(): Promise<Pigment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pigments")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPigmentRow(row as Record<string, unknown>));
}

export async function getPigmentById(id: string): Promise<Pigment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pigments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? mapPigmentRow(data as Record<string, unknown>) : null;
}

export async function createPigment(
  data: Omit<Pigment, "id" | "created_at" | "updated_at">
): Promise<Pigment> {
  const supabase = await resolveWriteClient();
  const { data: row, error } = await supabase
    .from("pigments")
    .insert({
      name: data.name,
      sku: data.sku ?? null,
      supplier: data.supplier ?? null,
      color_description: data.color_description ?? null,
      unit: data.unit ?? "g",
      quantity_on_hand: data.quantity_on_hand ?? 0,
      low_stock_threshold: data.reorder_point ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPigmentRow(row as Record<string, unknown>);
}

export type UpdatePigmentInput = Partial<
  Omit<Pigment, "sku" | "supplier" | "color_description" | "notes" | "reorder_point">
> & {
  sku?: string | null;
  supplier?: string | null;
  color_description?: string | null;
  notes?: string | null;
  reorder_point?: number | null;
};

export async function updatePigment(id: string, data: UpdatePigmentInput): Promise<Pigment> {
  const supabase = await resolveWriteClient();
  const { data: row, error } = await supabase
    .from("pigments")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.supplier !== undefined && { supplier: data.supplier }),
      ...(data.color_description !== undefined && { color_description: data.color_description }),
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
  return mapPigmentRow(row as Record<string, unknown>);
}

export async function deletePigment(id: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const documents = await listPigmentMsdsDocuments(id);
  for (const doc of documents) {
    await deletePigmentMsdsDocument(doc.id);
  }
  const { error } = await supabase.from("pigments").delete().eq("id", id);
  if (error) throw error;
}

export async function listPigmentMsdsDocuments(pigmentId: string): Promise<PigmentMsdsDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pigment_msds_documents")
    .select("*")
    .eq("pigment_id", pigmentId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMsdsRow(row as Record<string, unknown>));
}

export async function uploadPigmentMsdsDocument(
  pigmentId: string,
  file: File,
  notes?: string
): Promise<PigmentMsdsDocument> {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed for MSDS sheets");
  }
  if (file.size > MSDS_MAX_BYTES) {
    throw new Error("MSDS file must be 10 MB or smaller");
  }

  const pigment = await getPigmentById(pigmentId);
  if (!pigment) throw new Error("Pigment not found");

  const supabase = await resolveWriteClient();
  const documentId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name || "msds.pdf");
  const storagePath = `${pigmentId}/${documentId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MSDS_BUCKET)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: row, error: insertError } = await supabase
    .from("pigment_msds_documents")
    .insert({
      id: documentId,
      pigment_id: pigmentId,
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

export async function deletePigmentMsdsDocument(documentId: string): Promise<void> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("pigment_msds_documents")
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
    .from("pigment_msds_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) throw deleteError;
}

export async function getPigmentMsdsSignedUrl(
  documentId: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("pigment_msds_documents")
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

export async function countPigmentMsdsDocuments(pigmentIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (pigmentIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pigment_msds_documents")
    .select("pigment_id")
    .in("pigment_id", pigmentIds);

  if (error) throw error;

  for (const id of pigmentIds) counts.set(id, 0);
  for (const row of data ?? []) {
    const pigmentId = (row as { pigment_id: string }).pigment_id;
    counts.set(pigmentId, (counts.get(pigmentId) ?? 0) + 1);
  }

  return counts;
}
