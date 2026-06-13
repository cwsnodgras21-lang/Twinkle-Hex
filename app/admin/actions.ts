"use server";

/**
 * Admin server actions.
 */

import { revalidatePath } from "next/cache";
import {
  createRelease,
  deleteRelease,
  getReleaseById,
  updateRelease,
  type CreateReleaseInput,
} from "@/lib/admin/releases";
import { createFinishedInventoryItem } from "@/lib/admin/inventory";
import {
  createReleasePolish,
  deleteReleasePolish,
  getPolishById,
  replacePolishRecipeLines,
  updateReleasePolish,
} from "@/lib/admin/polishes";
import { createIngredient, updateIngredient } from "@/lib/admin/ingredients";
import { createSupply, updateSupply } from "@/lib/admin/supplies";
import {
  createPigment,
  deletePigmentMsdsDocument,
  getPigmentMsdsSignedUrl,
  updatePigment,
  uploadPigmentMsdsDocument,
} from "@/lib/admin/pigments";
import { createSocialPost, updateSocialPost } from "@/lib/admin/social";
import { createBatch, updateBatch } from "@/lib/admin/batches";
import { createSwatcher, createAssignment, updateSwatcher } from "@/lib/admin/swatchers";
import { createEvent, updateEvent } from "@/lib/admin/events";
import { createRetailPartner, updateRetailPartner } from "@/lib/admin/retail-partners";
import { createCharityPolish, updateCharityPolish } from "@/lib/admin/charity";
import { getErrorMessage } from "@/lib/errors";

/** Supabase PostgrestError is not always `instanceof Error`; read `.message` explicitly. */
function supabaseErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    const msg = (e as { message: string }).message;
    const details =
      "details" in e && typeof (e as { details: unknown }).details === "string"
        ? (e as { details: string }).details
        : "";
    return details ? `${msg} (${details})` : msg;
  }
  return fallback;
}

function trimOrNull(value: FormDataEntryValue | null): string | null | undefined {
  const trimmed = (value as string | null)?.trim();
  return trimmed === "" ? null : trimmed || undefined;
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type CreateReleaseResult = { ok: true; id: string } | { ok: false; error: string };

export async function createReleaseAction(formData: FormData): Promise<CreateReleaseResult> {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) return { ok: false, error: "Name is required" };

    const release = await createRelease({
      name: name.trim(),
      collection: (formData.get("collection") as string)?.trim() || undefined,
      description: (formData.get("description") as string)?.trim() || undefined,
      status: (formData.get("status") as CreateReleaseInput["status"]) || "concept",
      target_launch_date: (formData.get("target_launch_date") as string) || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    });

    revalidatePath("/admin/releases");
    revalidatePath("/admin/releases/new");
    return { ok: true, id: release.id };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to create release") };
  }
}

export type UpdateReleaseResult = { ok: true } | { ok: false; error: string };

export async function updateReleaseAction(
  id: string,
  formData: FormData
): Promise<UpdateReleaseResult> {
  try {
    await updateRelease(id, {
      name: (formData.get("name") as string)?.trim(),
      collection: (formData.get("collection") as string)?.trim() || undefined,
      description: (formData.get("description") as string)?.trim() || undefined,
      status: formData.get("status") as CreateReleaseInput["status"],
      target_launch_date: (formData.get("target_launch_date") as string) || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    });

    revalidatePath("/admin/releases");
    revalidatePath(`/admin/releases/${id}`);
    revalidatePath(`/admin/releases/${id}/swatchers`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to update release") };
  }
}

export type DeleteReleaseResult = { ok: true } | { ok: false; error: string };

export async function deleteReleaseAction(
  formData: FormData
): Promise<DeleteReleaseResult> {
  try {
    const id = (formData.get("release_id") as string)?.trim();
    if (!id) return { ok: false, error: "Missing release" };

    const release = await getReleaseById(id);
    if (!release) return { ok: false, error: "Release not found" };

    await deleteRelease(id);

    revalidatePath("/admin/releases");
    revalidatePath("/admin/releases/new");
    revalidatePath("/admin/polishes");
    revalidatePath(`/admin/releases/${id}`);
    revalidatePath(`/admin/releases/${id}/swatchers`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to delete release") };
  }
}

export type CreateIngredientResult = { ok: true; id: string } | { ok: false; error: string };

export async function createIngredientAction(
  formData: FormData
): Promise<CreateIngredientResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    const ingredient = await createIngredient({
      name,
      sku: trimOrNull(formData.get("sku")) ?? undefined,
      supplier: trimOrNull(formData.get("supplier")) ?? undefined,
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : undefined,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/ingredients");
    revalidatePath("/admin/ingredients/new");
    return { ok: true, id: ingredient.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create ingredient");
    console.error("createIngredientAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateIngredientAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    await updateIngredient(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      sku: trimOrNull(formData.get("sku")),
      supplier: trimOrNull(formData.get("supplier")),
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : null,
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/ingredients");
    revalidatePath(`/admin/ingredients/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update ingredient");
    console.error("updateIngredientAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type CreateSupplyResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSupplyAction(formData: FormData): Promise<CreateSupplyResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    const supply = await createSupply({
      name,
      sku: trimOrNull(formData.get("sku")) ?? undefined,
      category: trimOrNull(formData.get("category")) ?? undefined,
      unit: (formData.get("unit") as string)?.trim() || "each",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : undefined,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/supplies");
    revalidatePath("/admin/supplies/new");
    return { ok: true, id: supply.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create supply");
    console.error("createSupplyAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateSupplyAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    await updateSupply(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      sku: trimOrNull(formData.get("sku")),
      category: trimOrNull(formData.get("category")),
      unit: (formData.get("unit") as string)?.trim() || "each",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : null,
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/supplies");
    revalidatePath(`/admin/supplies/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update supply");
    console.error("updateSupplyAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type CreatePigmentResult = { ok: true; id: string } | { ok: false; error: string };

export async function createPigmentAction(formData: FormData): Promise<CreatePigmentResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    const pigment = await createPigment({
      name,
      sku: trimOrNull(formData.get("sku")) ?? undefined,
      supplier: trimOrNull(formData.get("supplier")) ?? undefined,
      color_description: trimOrNull(formData.get("color_description")) ?? undefined,
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : undefined,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/pigments");
    revalidatePath("/admin/pigments/new");
    return { ok: true, id: pigment.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create pigment");
    console.error("createPigmentAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updatePigmentAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    await updatePigment(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      sku: trimOrNull(formData.get("sku")),
      supplier: trimOrNull(formData.get("supplier")),
      color_description: trimOrNull(formData.get("color_description")),
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : null,
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/pigments");
    revalidatePath(`/admin/pigments/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update pigment");
    console.error("updatePigmentAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type UploadMsdsResult = { ok: true; id: string } | { ok: false; error: string };

export async function uploadPigmentMsdsAction(
  pigmentId: string,
  formData: FormData
): Promise<UploadMsdsResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Please choose a PDF file to upload" };
    }

    const doc = await uploadPigmentMsdsDocument(
      pigmentId,
      file,
      trimOrNull(formData.get("notes")) ?? undefined
    );

    revalidatePath("/admin/pigments");
    revalidatePath(`/admin/pigments/${pigmentId}`);
    return { ok: true, id: doc.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to upload MSDS sheet");
    console.error("uploadPigmentMsdsAction failed", { pigmentId, message, error: e });
    return { ok: false, error: message };
  }
}

export async function deletePigmentMsdsAction(
  pigmentId: string,
  documentId: string
): Promise<ActionResult> {
  try {
    await deletePigmentMsdsDocument(documentId);
    revalidatePath("/admin/pigments");
    revalidatePath(`/admin/pigments/${pigmentId}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to delete MSDS sheet");
    console.error("deletePigmentMsdsAction failed", { pigmentId, documentId, message, error: e });
    return { ok: false, error: message };
  }
}

export type MsdsDownloadResult = { ok: true; url: string } | { ok: false; error: string };

export async function getPigmentMsdsDownloadUrlAction(
  documentId: string
): Promise<MsdsDownloadResult> {
  try {
    const url = await getPigmentMsdsSignedUrl(documentId);
    return { ok: true, url };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to open MSDS sheet");
    return { ok: false, error: message };
  }
}

export type CreateSocialPostResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSocialPostAction(
  formData: FormData
): Promise<CreateSocialPostResult> {
  try {
    const post = await createSocialPost({
      platform: ((formData.get("platform") as string) || "instagram") as
        | "instagram"
        | "tiktok"
        | "twitter"
        | "other",
      content_type: trimOrNull(formData.get("content_type")) ?? undefined,
      scheduled_at: trimOrNull(formData.get("scheduled_at")) ?? undefined,
      published_at: trimOrNull(formData.get("published_at")) ?? undefined,
      status: ((formData.get("status") as string) || "draft") as
        | "draft"
        | "scheduled"
        | "published"
        | "cancelled",
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/social");
    revalidatePath("/admin/social/new");
    return { ok: true, id: post.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create social post");
    console.error("createSocialPostAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateSocialPostAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateSocialPost(id, {
      platform: ((formData.get("platform") as string) || "instagram") as
        | "instagram"
        | "tiktok"
        | "twitter"
        | "other",
      content_type: trimOrNull(formData.get("content_type")),
      scheduled_at: trimOrNull(formData.get("scheduled_at")),
      published_at: trimOrNull(formData.get("published_at")),
      status: ((formData.get("status") as string) || "draft") as
        | "draft"
        | "scheduled"
        | "published"
        | "cancelled",
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/social");
    revalidatePath(`/admin/social/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update social post");
    console.error("updateSocialPostAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type CreateInventoryItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createInventoryItemAction(
  formData: FormData
): Promise<CreateInventoryItemResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const qtyRaw = formData.get("quantity_on_hand");
    const reservedRaw = formData.get("reserved_quantity");
    const quantity_on_hand = qtyRaw === "" || qtyRaw == null ? 0 : Number(qtyRaw);
    const reserved_quantity = reservedRaw === "" || reservedRaw == null ? 0 : Number(reservedRaw);

    if (Number.isNaN(quantity_on_hand) || quantity_on_hand < 0) {
      return { ok: false, error: "Quantity on hand must be a valid number ≥ 0" };
    }
    if (Number.isNaN(reserved_quantity) || reserved_quantity < 0) {
      return { ok: false, error: "Reserved quantity must be a valid number ≥ 0" };
    }

    const releaseIdRaw = (formData.get("release_id") as string)?.trim();
    const release_id = releaseIdRaw && releaseIdRaw.length > 0 ? releaseIdRaw : undefined;

    const row = await createFinishedInventoryItem({
      name,
      sku: (formData.get("sku") as string)?.trim() || undefined,
      release_id,
      quantity_on_hand,
      reserved_quantity,
      location: (formData.get("location") as string)?.trim() || undefined,
      product_id: (formData.get("product_id") as string)?.trim() || undefined,
      variant_id: (formData.get("variant_id") as string)?.trim() || undefined,
      batch_id: (formData.get("batch_id") as string)?.trim() || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    });

    revalidatePath("/admin/inventory");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to create inventory item") };
  }
}

// --- Release polishes + recipe lines ---

export type CreateReleasePolishResult = { ok: true; id: string } | { ok: false; error: string };

export async function createReleasePolishAction(
  formData: FormData
): Promise<CreateReleasePolishResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    if (!releaseId) return { ok: false, error: "Missing release" };
    const release = await getReleaseById(releaseId);
    if (!release) return { ok: false, error: "Release not found" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Polish name is required" };

    const sortRaw = formData.get("sort_order");
    const sort_order = sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) return { ok: false, error: "Sort order must be a number" };

    const row = await createReleasePolish(releaseId, { name, sort_order });

    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath(`/admin/releases/${releaseId}/polishes/new`);
    revalidatePath("/admin/polishes");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to create polish") };
  }
}

export type UpdateReleasePolishResult = { ok: true } | { ok: false; error: string };

export async function updateReleasePolishAction(
  formData: FormData
): Promise<UpdateReleasePolishResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!releaseId || !polishId) return { ok: false, error: "Missing release or polish" };

    const polish = await getPolishById(polishId);
    if (!polish || polish.release_id !== releaseId) {
      return { ok: false, error: "Polish not found for this release" };
    }

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const sortRaw = formData.get("sort_order");
    const sort_order = sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) return { ok: false, error: "Sort order must be a number" };

    await updateReleasePolish(polishId, { name, sort_order });

    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    revalidatePath("/admin/polishes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to update polish") };
  }
}

export type DeleteReleasePolishResult = { ok: true } | { ok: false; error: string };

export async function deleteReleasePolishAction(
  formData: FormData
): Promise<DeleteReleasePolishResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!releaseId || !polishId) return { ok: false, error: "Missing release or polish" };

    const polish = await getPolishById(polishId);
    if (!polish || polish.release_id !== releaseId) {
      return { ok: false, error: "Polish not found for this release" };
    }

    await deleteReleasePolish(polishId);

    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    revalidatePath("/admin/polishes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to delete polish") };
  }
}

export type ReplacePolishRecipeResult = { ok: true } | { ok: false; error: string };

const MAX_RECIPE_LINES = 200;

export async function replacePolishRecipeAction(
  formData: FormData
): Promise<ReplacePolishRecipeResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!releaseId || !polishId) return { ok: false, error: "Missing release or polish" };

    const polish = await getPolishById(polishId);
    if (!polish || polish.release_id !== releaseId) {
      return { ok: false, error: "Polish not found for this release" };
    }

    const raw = formData.get("recipe_json") as string;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw ?? "[]");
    } catch {
      return { ok: false, error: "Invalid recipe data" };
    }

    if (!Array.isArray(parsed)) return { ok: false, error: "Recipe must be a list" };
    if (parsed.length > MAX_RECIPE_LINES) {
      return { ok: false, error: `At most ${MAX_RECIPE_LINES} ingredients allowed` };
    }

    const lines: { ingredient_name: string; amount_oz: number }[] = [];
    for (let i = 0; i < parsed.length; i += 1) {
      const item = parsed[i];
      if (!item || typeof item !== "object") return { ok: false, error: `Invalid row ${i + 1}` };
      const o = item as Record<string, unknown>;
      const ingredient_name = String(o.ingredient_name ?? "").trim();
      const amount_oz = Number(o.amount_oz);
      if (!ingredient_name) {
        return { ok: false, error: `Row ${i + 1}: ingredient name is required` };
      }
      if (Number.isNaN(amount_oz) || amount_oz < 0) {
        return { ok: false, error: `Row ${i + 1}: amount (oz) must be a number ≥ 0` };
      }
      lines.push({ ingredient_name, amount_oz });
    }

    await replacePolishRecipeLines(polishId, lines);

    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath("/admin/polishes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to save recipe") };
  }
}

// --- Batch actions ---

export type CreateBatchResult = { ok: true; id: string } | { ok: false; error: string };

export async function createBatchAction(formData: FormData): Promise<CreateBatchResult> {
  try {
    const batchNumber = (formData.get("batch_number") as string)?.trim();
    if (!batchNumber) return { ok: false, error: "Batch number is required" };

    const quantityRaw = (formData.get("quantity_produced") as string)?.trim();
    const quantityProduced = quantityRaw ? parseInt(quantityRaw, 10) : undefined;

    const batch = await createBatch({
      batch_number: batchNumber,
      product_id: trimOrNull(formData.get("product_id")) ?? undefined,
      status: ((formData.get("status") as string) || "planned") as
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled",
      planned_date: trimOrNull(formData.get("planned_date")) ?? undefined,
      completed_at: trimOrNull(formData.get("completed_at")) ?? undefined,
      quantity_produced:
        quantityProduced == null || Number.isNaN(quantityProduced) ? undefined : quantityProduced,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/batches/new");
    return { ok: true, id: batch.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create batch");
    console.error("createBatchAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateBatchAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const quantityRaw = (formData.get("quantity_produced") as string)?.trim();
    const quantityProduced = quantityRaw ? parseInt(quantityRaw, 10) : null;

    await updateBatch(id, {
      batch_number: trimOrNull(formData.get("batch_number")) ?? undefined,
      product_id: trimOrNull(formData.get("product_id")),
      status: formData.get("status") as "planned" | "in_progress" | "completed" | "cancelled",
      planned_date: trimOrNull(formData.get("planned_date")),
      completed_at: trimOrNull(formData.get("completed_at")),
      quantity_produced:
        quantityProduced == null || Number.isNaN(quantityProduced) ? undefined : quantityProduced,
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update batch");
    console.error("updateBatchAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

// --- Swatcher actions ---

export type CreateSwatcherResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSwatcherAction(formData: FormData): Promise<CreateSwatcherResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const swatcher = await createSwatcher({
      name,
      email: trimOrNull(formData.get("email")) ?? undefined,
      social_handle: trimOrNull(formData.get("social_handle")) ?? undefined,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/swatchers");
    revalidatePath("/admin/swatchers/new");
    return { ok: true, id: swatcher.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create swatcher");
    console.error("createSwatcherAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateSwatcherAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateSwatcher(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      email: trimOrNull(formData.get("email")),
      social_handle: trimOrNull(formData.get("social_handle")),
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/swatchers");
    revalidatePath(`/admin/swatchers/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update swatcher");
    console.error("updateSwatcherAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type CreateAssignmentResult = { ok: true } | { ok: false; error: string };

export async function createAssignmentAction(
  releaseId: string,
  formData: FormData
): Promise<CreateAssignmentResult> {
  try {
    const swatcherId = (formData.get("swatcher_id") as string)?.trim();
    if (!swatcherId) return { ok: false, error: "Choose a swatcher" };

    await createAssignment({
      swatcher_id: swatcherId,
      release_id: releaseId,
      shade_name: trimOrNull(formData.get("shade_name")) ?? undefined,
      status: ((formData.get("status") as string) || "pending") as
        | "pending"
        | "sent"
        | "received"
        | "feedback",
      sent_at: trimOrNull(formData.get("sent_at")) ?? undefined,
      feedback_notes: trimOrNull(formData.get("feedback_notes")) ?? undefined,
    });

    revalidatePath(`/admin/releases/${releaseId}/swatchers`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create swatcher assignment");
    console.error("createAssignmentAction failed", { releaseId, message, error: e });
    return { ok: false, error: message };
  }
}

// --- Event actions ---

export type CreateEventResult = { ok: true; id: string } | { ok: false; error: string };

export async function createEventAction(formData: FormData): Promise<CreateEventResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const startDate = (formData.get("start_date") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    if (!startDate) return { ok: false, error: "Start date is required" };

    const event = await createEvent({
      name,
      event_type: trimOrNull(formData.get("event_type")) ?? undefined,
      start_date: startDate,
      end_date: trimOrNull(formData.get("end_date")) ?? undefined,
      location: trimOrNull(formData.get("location")) ?? undefined,
      booth: trimOrNull(formData.get("booth")) ?? undefined,
      status: ((formData.get("status") as string) || "planned") as
        | "planned"
        | "confirmed"
        | "completed"
        | "cancelled",
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/events");
    revalidatePath("/admin/events/new");
    return { ok: true, id: event.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create event");
    console.error("createEventAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateEventAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await updateEvent(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      event_type: trimOrNull(formData.get("event_type")),
      start_date: trimOrNull(formData.get("start_date")) ?? undefined,
      end_date: trimOrNull(formData.get("end_date")),
      location: trimOrNull(formData.get("location")),
      booth: trimOrNull(formData.get("booth")),
      status: formData.get("status") as "planned" | "confirmed" | "completed" | "cancelled",
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update event");
    console.error("updateEventAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

// --- Retail partner actions ---

export type CreateRetailPartnerResult = { ok: true; id: string } | { ok: false; error: string };

export async function createRetailPartnerAction(
  formData: FormData
): Promise<CreateRetailPartnerResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const partner = await createRetailPartner({
      name,
      contact_email: trimOrNull(formData.get("contact_email")) ?? undefined,
      contact_phone: trimOrNull(formData.get("contact_phone")) ?? undefined,
      address: trimOrNull(formData.get("address")) ?? undefined,
      status: ((formData.get("status") as string) || "active") as
        | "active"
        | "inactive"
        | "pending",
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/retail-partners");
    revalidatePath("/admin/retail-partners/new");
    return { ok: true, id: partner.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create retail partner");
    console.error("createRetailPartnerAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateRetailPartnerAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await updateRetailPartner(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      contact_email: trimOrNull(formData.get("contact_email")),
      contact_phone: trimOrNull(formData.get("contact_phone")),
      address: trimOrNull(formData.get("address")),
      status: formData.get("status") as "active" | "inactive" | "pending",
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/retail-partners");
    revalidatePath(`/admin/retail-partners/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update retail partner");
    console.error("updateRetailPartnerAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

// --- Charity actions ---

export type CreateCharityPolishResult = { ok: true; id: string } | { ok: false; error: string };

export async function createCharityPolishAction(
  formData: FormData
): Promise<CreateCharityPolishResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const charityName = (formData.get("charity_name") as string)?.trim();
    if (!name) return { ok: false, error: "Polish name is required" };
    if (!charityName) return { ok: false, error: "Charity name is required" };

    const donationRaw = (formData.get("donation_per_unit") as string)?.trim();
    const totalRaw = (formData.get("total_raised") as string)?.trim();

    const item = await createCharityPolish({
      name,
      product_id: trimOrNull(formData.get("product_id")) ?? undefined,
      charity_name: charityName,
      donation_per_unit: donationRaw ? parseFloat(donationRaw) : undefined,
      total_raised: totalRaw ? parseFloat(totalRaw) : undefined,
      status: ((formData.get("status") as string) || "active") as
        | "active"
        | "completed"
        | "paused",
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/charity");
    revalidatePath("/admin/charity/new");
    return { ok: true, id: item.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to create charity polish");
    console.error("createCharityPolishAction failed", { message, error: e });
    return { ok: false, error: message };
  }
}

export async function updateCharityPolishAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const donationRaw = (formData.get("donation_per_unit") as string)?.trim();
    const totalRaw = (formData.get("total_raised") as string)?.trim();

    await updateCharityPolish(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      product_id: trimOrNull(formData.get("product_id")),
      charity_name: trimOrNull(formData.get("charity_name")) ?? undefined,
      donation_per_unit: donationRaw ? parseFloat(donationRaw) : undefined,
      total_raised: totalRaw ? parseFloat(totalRaw) : undefined,
      status: formData.get("status") as "active" | "completed" | "paused",
      notes: trimOrNull(formData.get("notes")),
    });

    revalidatePath("/admin/charity");
    revalidatePath(`/admin/charity/${id}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to update charity polish");
    console.error("updateCharityPolishAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}
