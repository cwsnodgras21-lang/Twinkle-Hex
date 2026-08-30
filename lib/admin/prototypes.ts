/**
 * Polish prototypes — 15 ml development formulas.
 * Separate from ingredient R&D (`rd_prototypes`).
 */

import { resolveWriteClient, resolveDataClient, num } from "@/lib/admin/supabase-write";
import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import {
  createPolish,
  updatePolish,
  getPolishDetail,
  replacePolishRecipeLines,
} from "@/lib/admin/polishes";
import type {
  PolishPrototype,
  PolishPrototypeLine,
  PolishPrototypePhoto,
  PolishPrototypeStatus,
} from "@/types/admin";

export const PROTOTYPE_PHOTOS_BUCKET = "prototype-photos";
export const PROTOTYPE_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function getWriteClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createClient();
}

async function resolvePhotoClient() {
  const client = getWriteClient();
  return client instanceof Promise ? await client : client;
}

function mapPrototype(row: Record<string, unknown>): PolishPrototype {
  return {
    id: row.id as string,
    name: row.name as string,
    created_date: row.created_date as string,
    target_size_ml: num(row.target_size_ml, 15),
    status: (row.status as PolishPrototypeStatus) ?? "testing",
    notes: (row.notes as string) ?? undefined,
    observations: (row.observations as string) ?? undefined,
    promoted_polish_id: (row.promoted_polish_id as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLine(row: Record<string, unknown>): PolishPrototypeLine {
  return {
    id: row.id as string,
    prototype_id: row.prototype_id as string,
    sort_order: num(row.sort_order),
    ingredient_name: row.ingredient_name as string,
    amount_oz: num(row.amount_oz),
    ingredient_id: (row.ingredient_id as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapPhoto(row: Record<string, unknown>): PolishPrototypePhoto {
  return {
    id: row.id as string,
    prototype_id: row.prototype_id as string,
    file_name: row.file_name as string,
    storage_path: row.storage_path as string,
    file_size: row.file_size != null ? Number(row.file_size) : undefined,
    mime_type: (row.mime_type as string) ?? "image/jpeg",
    caption: (row.caption as string) ?? undefined,
    sort_order: num(row.sort_order),
    uploaded_at: row.uploaded_at as string,
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export async function listPolishPrototypes(): Promise<PolishPrototype[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("polish_prototypes")
    .select("*")
    .order("created_date", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapPrototype(r as Record<string, unknown>));
}

export async function getPolishPrototype(id: string): Promise<
  | (PolishPrototype & { lines: PolishPrototypeLine[]; photos: PolishPrototypePhoto[] })
  | null
> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase.from("polish_prototypes").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const proto = mapPrototype(data as Record<string, unknown>);
  const [lines, photos] = await Promise.all([
    listPrototypeLines(id),
    listPrototypePhotos(id),
  ]);
  return { ...proto, lines, photos };
}

export async function listPrototypeLines(prototypeId: string): Promise<PolishPrototypeLine[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("polish_prototype_lines")
    .select("*")
    .eq("prototype_id", prototypeId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapLine(r as Record<string, unknown>));
}

export async function listPrototypePhotos(prototypeId: string): Promise<PolishPrototypePhoto[]> {
  const supabase = await resolveDataClient();
  const { data, error } = await supabase
    .from("polish_prototype_photos")
    .select("*")
    .eq("prototype_id", prototypeId)
    .order("sort_order", { ascending: true })
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapPhoto(r as Record<string, unknown>));
}

export async function createPolishPrototype(input: {
  name: string;
  created_date?: string;
  target_size_ml?: number;
  notes?: string | null;
  observations?: string | null;
  status?: PolishPrototypeStatus;
  lines?: Array<{ ingredient_name: string; amount_oz: number; ingredient_id?: string | null }>;
}): Promise<PolishPrototype> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("polish_prototypes")
    .insert({
      name: input.name.trim(),
      created_date: input.created_date ?? new Date().toISOString().slice(0, 10),
      target_size_ml: input.target_size_ml ?? 15,
      notes: input.notes ?? null,
      observations: input.observations ?? null,
      status: input.status ?? "testing",
    })
    .select()
    .single();
  if (error) throw error;
  const proto = mapPrototype(data as Record<string, unknown>);
  if (input.lines && input.lines.length > 0) {
    await replacePrototypeLines(proto.id, input.lines);
  }
  return proto;
}

export async function updatePolishPrototype(
  id: string,
  input: {
    name?: string;
    created_date?: string;
    target_size_ml?: number;
    notes?: string | null;
    observations?: string | null;
    status?: PolishPrototypeStatus;
  }
): Promise<PolishPrototype> {
  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("polish_prototypes")
    .update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.created_date !== undefined ? { created_date: input.created_date } : {}),
      ...(input.target_size_ml !== undefined ? { target_size_ml: input.target_size_ml } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.observations !== undefined ? { observations: input.observations } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapPrototype(data as Record<string, unknown>);
}

export async function replacePrototypeLines(
  prototypeId: string,
  lines: Array<{ ingredient_name: string; amount_oz: number; ingredient_id?: string | null }>
): Promise<void> {
  const supabase = await resolveWriteClient();
  const { error: delError } = await supabase
    .from("polish_prototype_lines")
    .delete()
    .eq("prototype_id", prototypeId);
  if (delError) throw delError;
  if (lines.length === 0) return;
  const { error } = await supabase.from("polish_prototype_lines").insert(
    lines.map((line, i) => ({
      prototype_id: prototypeId,
      sort_order: i,
      ingredient_name: line.ingredient_name.trim(),
      amount_oz: line.amount_oz,
      ingredient_id: line.ingredient_id ?? null,
    }))
  );
  if (error) throw error;
}

export async function deletePolishPrototype(id: string): Promise<void> {
  const photos = await listPrototypePhotos(id);
  for (const photo of photos) {
    await deletePrototypePhoto(photo.id);
  }
  const supabase = await resolveWriteClient();
  const { error } = await supabase.from("polish_prototypes").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPrototypePhoto(
  prototypeId: string,
  file: File,
  caption?: string
): Promise<PolishPrototypePhoto> {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or HEIC images are allowed");
  }
  if (file.size > PROTOTYPE_PHOTO_MAX_BYTES) {
    throw new Error("Photo must be 10 MB or smaller");
  }

  const supabase = await resolvePhotoClient();
  const photoId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name || "photo.jpg");
  const storagePath = `${prototypeId}/${photoId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PROTOTYPE_PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: row, error: insertError } = await supabase
    .from("polish_prototype_photos")
    .insert({
      id: photoId,
      prototype_id: prototypeId,
      file_name: safeName,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      caption: caption ?? null,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(PROTOTYPE_PHOTOS_BUCKET).remove([storagePath]);
    throw insertError;
  }
  return mapPhoto(row as Record<string, unknown>);
}

export async function deletePrototypePhoto(photoId: string): Promise<void> {
  const supabase = await resolvePhotoClient();
  const { data, error } = await supabase
    .from("polish_prototype_photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return;
    throw error;
  }
  const photo = mapPhoto(data as Record<string, unknown>);
  await supabase.storage.from(PROTOTYPE_PHOTOS_BUCKET).remove([photo.storage_path]);
  const { error: deleteError } = await supabase
    .from("polish_prototype_photos")
    .delete()
    .eq("id", photoId);
  if (deleteError) throw deleteError;
}

export async function getPrototypePhotoSignedUrl(
  photoId: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = await resolvePhotoClient();
  const { data, error } = await supabase
    .from("polish_prototype_photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new Error("Photo not found");
    throw error;
  }
  const storagePath = (data as { storage_path: string }).storage_path;
  const { data: signed, error: signError } = await supabase.storage
    .from(PROTOTYPE_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (signError) throw signError;
  if (!signed?.signedUrl) throw new Error("Could not generate photo URL");
  return signed.signedUrl;
}

/**
 * Promote selected prototype → production polish + formula.
 * Preserves the prototype and links both ways.
 */
export async function promotePrototypeToProduction(
  prototypeId: string,
  opts?: { polish_id?: string | null; polish_name?: string | null; color_hex?: string | null }
): Promise<{ polish_id: string; prototype: PolishPrototype }> {
  const detail = await getPolishPrototype(prototypeId);
  if (!detail) throw new Error("Prototype not found");
  if (detail.lines.length === 0) throw new Error("Prototype has no formula lines");

  let polishId = opts?.polish_id ?? detail.promoted_polish_id ?? null;

  if (polishId) {
    const existing = await getPolishDetail(polishId);
    if (!existing) throw new Error("Target polish not found");
    await updatePolish(polishId, {
      ...(opts?.polish_name ? { name: opts.polish_name } : {}),
      ...(opts?.color_hex !== undefined ? { color_hex: opts.color_hex } : {}),
      source_prototype_id: prototypeId,
    });
  } else {
    const polish = await createPolish({
      name: (opts?.polish_name ?? detail.name).trim(),
      color_hex: opts?.color_hex ?? null,
      sort_order: 0,
      notes: `Promoted from prototype: ${detail.name}`,
      is_core: false,
      source_prototype_id: prototypeId,
    });
    polishId = polish.id;
  }

  await replacePolishRecipeLines(
    polishId,
    detail.lines.map((l) => ({
      ingredient_name: l.ingredient_name,
      amount_oz: l.amount_oz,
      ingredient_id: l.ingredient_id ?? null,
    }))
  );

  const supabase = await resolveWriteClient();
  const { data, error } = await supabase
    .from("polish_prototypes")
    .update({
      status: "selected",
      promoted_polish_id: polishId,
    })
    .eq("id", prototypeId)
    .select()
    .single();
  if (error) throw error;

  return { polish_id: polishId, prototype: mapPrototype(data as Record<string, unknown>) };
}
