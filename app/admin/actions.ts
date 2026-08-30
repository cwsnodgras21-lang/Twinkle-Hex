"use server";

/**
 * Admin server actions — one section per gravitational center:
 * Ingredients, Polishes (+ recipes), and Finished Stock.
 */

import { revalidatePath } from "next/cache";
import {
  createFinishedInventoryItem,
  updateFinishedInventoryItem,
  deleteFinishedInventoryItem,
} from "@/lib/admin/inventory";
import {
  createPolish,
  deletePolish,
  getPolishById,
  replacePolishRecipeLines,
  updatePolish,
} from "@/lib/admin/polishes";
import {
  createIngredient,
  deleteIngredient,
  deleteIngredientMsdsDocument,
  getIngredientMsdsSignedUrl,
  linkIngredientGoogleDriveSds,
  updateIngredient,
  uploadIngredientMsdsDocument,
} from "@/lib/admin/ingredients";
import type { IngredientCategory } from "@/types/admin";
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

// --- Ingredients (raw materials, pigments, supplies — one table) ---

const INGREDIENT_CATEGORIES: IngredientCategory[] = ["ingredient", "pigment", "supply"];

function parseCategory(formData: FormData): IngredientCategory {
  const raw = (formData.get("category") as string)?.trim();
  return (INGREDIENT_CATEGORIES as string[]).includes(raw) ? (raw as IngredientCategory) : "ingredient";
}

export type CreateIngredientResult = { ok: true; id: string } | { ok: false; error: string };

export async function createIngredientAction(formData: FormData): Promise<CreateIngredientResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    const ingredient = await createIngredient({
      name,
      category: parseCategory(formData),
      lifecycle_status:
        ((formData.get("lifecycle_status") as string)?.trim() as
          | "tracked"
          | "experimental"
          | "approved"
          | "rejected"
          | "archived") || "tracked",
      sku: trimOrNull(formData.get("sku")) ?? undefined,
      supplier: trimOrNull(formData.get("supplier")) ?? undefined,
      supplier_identifier: trimOrNull(formData.get("supplier_identifier")) ?? undefined,
      color_description: trimOrNull(formData.get("color_description")) ?? undefined,
      received_date: trimOrNull(formData.get("received_date")) ?? undefined,
      lot_number: trimOrNull(formData.get("lot_number")) ?? undefined,
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : undefined,
      purchase_cost: (() => {
        const v = (formData.get("purchase_cost") as string)?.trim();
        return v ? Number(v) : undefined;
      })(),
      purchase_quantity: (() => {
        const v = (formData.get("purchase_quantity") as string)?.trim();
        return v ? Number(v) : undefined;
      })(),
      unit_cost: (() => {
        const v = (formData.get("unit_cost") as string)?.trim();
        return v ? Number(v) : undefined;
      })(),
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

export async function updateIngredientAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const quantityRaw = (formData.get("quantity_on_hand") as string)?.trim();
    const reorderRaw = (formData.get("reorder_point") as string)?.trim();

    await updateIngredient(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      category: parseCategory(formData),
      lifecycle_status:
        ((formData.get("lifecycle_status") as string)?.trim() as
          | "tracked"
          | "experimental"
          | "approved"
          | "rejected"
          | "archived") || undefined,
      sku: trimOrNull(formData.get("sku")),
      supplier: trimOrNull(formData.get("supplier")),
      supplier_identifier: trimOrNull(formData.get("supplier_identifier")),
      color_description: trimOrNull(formData.get("color_description")),
      received_date: trimOrNull(formData.get("received_date")),
      lot_number: trimOrNull(formData.get("lot_number")),
      unit: (formData.get("unit") as string)?.trim() || "g",
      quantity_on_hand: quantityRaw ? Number(quantityRaw) : 0,
      reorder_point: reorderRaw ? Number(reorderRaw) : null,
      purchase_cost: (() => {
        const v = (formData.get("purchase_cost") as string)?.trim();
        return v === "" ? null : v ? Number(v) : undefined;
      })(),
      purchase_quantity: (() => {
        const v = (formData.get("purchase_quantity") as string)?.trim();
        return v === "" ? null : v ? Number(v) : undefined;
      })(),
      unit_cost: (() => {
        const v = (formData.get("unit_cost") as string)?.trim();
        return v === "" ? null : v ? Number(v) : undefined;
      })(),
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

export async function deleteIngredientAction(id: string): Promise<ActionResult> {
  try {
    await deleteIngredient(id);
    revalidatePath("/admin/ingredients");
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to delete ingredient");
    console.error("deleteIngredientAction failed", { id, message, error: e });
    return { ok: false, error: message };
  }
}

export type UploadMsdsResult = { ok: true; id: string } | { ok: false; error: string };

export async function uploadIngredientMsdsAction(
  ingredientId: string,
  formData: FormData
): Promise<UploadMsdsResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Please choose a PDF file to upload" };
    }

    const doc = await uploadIngredientMsdsDocument(
      ingredientId,
      file,
      trimOrNull(formData.get("notes")) ?? undefined
    );

    revalidatePath("/admin/ingredients");
    revalidatePath(`/admin/ingredients/${ingredientId}`);
    return { ok: true, id: doc.id };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to upload MSDS sheet");
    console.error("uploadIngredientMsdsAction failed", { ingredientId, message, error: e });
    return { ok: false, error: message };
  }
}

export async function deleteIngredientMsdsAction(
  ingredientId: string,
  documentId: string
): Promise<ActionResult> {
  try {
    await deleteIngredientMsdsDocument(documentId);
    revalidatePath("/admin/ingredients");
    revalidatePath(`/admin/ingredients/${ingredientId}`);
    return { ok: true };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to delete MSDS sheet");
    console.error("deleteIngredientMsdsAction failed", { ingredientId, documentId, message, error: e });
    return { ok: false, error: message };
  }
}

export async function linkIngredientGoogleDriveSdsAction(
  ingredientId: string,
  formData: FormData
): Promise<UploadMsdsResult> {
  try {
    const file_name = (formData.get("file_name") as string)?.trim() || "SDS";
    const google_drive_file_id = (formData.get("google_drive_file_id") as string)?.trim();
    const google_drive_url = (formData.get("google_drive_url") as string)?.trim();
    if (!google_drive_file_id || !google_drive_url) {
      return { ok: false, error: "Drive file ID and URL are required" };
    }
    const doc = await linkIngredientGoogleDriveSds({
      ingredient_id: ingredientId,
      file_name,
      google_drive_file_id,
      google_drive_url,
      verified_at: trimOrNull(formData.get("verified_at")) ?? null,
      notes: trimOrNull(formData.get("notes")) ?? null,
    });
    revalidatePath("/admin/ingredients");
    revalidatePath(`/admin/ingredients/${ingredientId}`);
    return { ok: true, id: doc.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to link Google Drive SDS") };
  }
}

export type MsdsDownloadResult = { ok: true; url: string } | { ok: false; error: string };

export async function getIngredientMsdsDownloadUrlAction(documentId: string): Promise<MsdsDownloadResult> {
  try {
    const url = await getIngredientMsdsSignedUrl(documentId);
    return { ok: true, url };
  } catch (e) {
    const message = getErrorMessage(e, "Failed to open MSDS sheet");
    return { ok: false, error: message };
  }
}

// --- Polishes + recipes ---

export type CreatePolishResult = { ok: true; id: string } | { ok: false; error: string };

export async function createPolishAction(formData: FormData): Promise<CreatePolishResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Polish name is required" };

    const sortRaw = formData.get("sort_order");
    const sort_order = sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) return { ok: false, error: "Sort order must be a number" };

    const colorHex = trimOrNull(formData.get("color_hex"));
    if (colorHex && !/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
      return { ok: false, error: "Swatch color must be a hex code like #cb508f" };
    }

    const row = await createPolish({
      name,
      sort_order,
      color_hex: colorHex ?? null,
      notes: trimOrNull(formData.get("notes")) ?? null,
    });

    revalidatePath("/admin/polishes");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to create polish") };
  }
}

export async function updatePolishAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const existing = await getPolishById(id);
    if (!existing) return { ok: false, error: "Polish not found" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const sortRaw = formData.get("sort_order");
    const sort_order = sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) return { ok: false, error: "Sort order must be a number" };

    const colorHex = trimOrNull(formData.get("color_hex"));
    if (colorHex && !/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
      return { ok: false, error: "Swatch color must be a hex code like #cb508f" };
    }

    await updatePolish(id, {
      name,
      sort_order,
      color_hex: colorHex ?? null,
      notes: trimOrNull(formData.get("notes")) ?? null,
    });

    revalidatePath("/admin/polishes");
    revalidatePath(`/admin/polishes/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to update polish") };
  }
}

export async function deletePolishAction(id: string): Promise<ActionResult> {
  try {
    await deletePolish(id);
    revalidatePath("/admin/polishes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to delete polish") };
  }
}

export type ReplacePolishRecipeResult = { ok: true } | { ok: false; error: string };

const MAX_RECIPE_LINES = 200;

export async function replacePolishRecipeAction(formData: FormData): Promise<ReplacePolishRecipeResult> {
  try {
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!polishId) return { ok: false, error: "Missing polish" };

    const polish = await getPolishById(polishId);
    if (!polish) return { ok: false, error: "Polish not found" };

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

    revalidatePath(`/admin/polishes/${polishId}`);
    revalidatePath("/admin/polishes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to save recipe") };
  }
}

// --- Finished stock ---

export type CreateInventoryItemResult = { ok: true; id: string } | { ok: false; error: string };

export async function createInventoryItemAction(formData: FormData): Promise<CreateInventoryItemResult> {
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

    const polish_id = trimOrNull(formData.get("polish_id")) ?? undefined;

    const row = await createFinishedInventoryItem({
      name,
      sku: (formData.get("sku") as string)?.trim() || undefined,
      polish_id,
      quantity_on_hand,
      reserved_quantity,
      location: (formData.get("location") as string)?.trim() || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    });

    revalidatePath("/admin/inventory");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to create inventory item") };
  }
}

export async function updateInventoryItemAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const qtyRaw = formData.get("quantity_on_hand");
    const reservedRaw = formData.get("reserved_quantity");
    const quantity_on_hand = qtyRaw === "" || qtyRaw == null ? undefined : Number(qtyRaw);
    const reserved_quantity = reservedRaw === "" || reservedRaw == null ? undefined : Number(reservedRaw);

    await updateFinishedInventoryItem(id, {
      name: trimOrNull(formData.get("name")) ?? undefined,
      sku: trimOrNull(formData.get("sku")) ?? undefined,
      polish_id: trimOrNull(formData.get("polish_id")) ?? undefined,
      quantity_on_hand,
      reserved_quantity,
      location: trimOrNull(formData.get("location")) ?? undefined,
      notes: trimOrNull(formData.get("notes")) ?? undefined,
    });

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to update inventory item") };
  }
}

export async function deleteInventoryItemAction(id: string): Promise<ActionResult> {
  try {
    await deleteFinishedInventoryItem(id);
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to delete inventory item") };
  }
}
