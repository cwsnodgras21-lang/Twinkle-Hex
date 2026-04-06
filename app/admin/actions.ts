"use server";

/**
 * Admin server actions.
 * Wire forms to these when Supabase + auth are ready.
 * Future: requireAdmin() before mutations.
 */

import { revalidatePath } from "next/cache";
import {
  createRelease,
  getReleaseById,
  updateRelease,
  type CreateReleaseInput,
} from "@/lib/admin/releases";
import { createFinishedInventoryItem } from "@/lib/admin/inventory";
import {
  createRecipeLine,
  createReleasePolish,
  deleteRecipeLine,
  deleteReleasePolish,
  getPolishById,
  getPolishDetail,
  updateRecipeLine,
  updateReleasePolish,
} from "@/lib/admin/polishes";

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

export type CreateReleaseResult = { ok: true; id: string } | { ok: false; error: string };

export async function createReleaseAction(
  formData: FormData
): Promise<CreateReleaseResult> {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) {
      return { ok: false, error: "Name is required" };
    }

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

export type CreateInventoryItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Create a finished goods inventory row. Surfaces Supabase errors (missing table, FK, RLS).
 */
export async function createInventoryItemAction(
  formData: FormData
): Promise<CreateInventoryItemResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      return { ok: false, error: "Name is required" };
    }

    const qtyRaw = formData.get("quantity_on_hand");
    const reservedRaw = formData.get("reserved_quantity");
    const quantity_on_hand =
      qtyRaw === "" || qtyRaw == null ? 0 : Number(qtyRaw);
    const reserved_quantity =
      reservedRaw === "" || reservedRaw == null ? 0 : Number(reservedRaw);

    if (Number.isNaN(quantity_on_hand) || quantity_on_hand < 0) {
      return { ok: false, error: "Quantity on hand must be a valid number ≥ 0" };
    }
    if (Number.isNaN(reserved_quantity) || reserved_quantity < 0) {
      return { ok: false, error: "Reserved quantity must be a valid number ≥ 0" };
    }

    const releaseIdRaw = (formData.get("release_id") as string)?.trim();
    const release_id =
      releaseIdRaw && releaseIdRaw.length > 0 ? releaseIdRaw : undefined;

    const row = await createFinishedInventoryItem({
      name,
      sku: (formData.get("sku") as string)?.trim() || undefined,
      release_id,
      quantity_on_hand,
      reserved_quantity,
      location: (formData.get("location") as string)?.trim() || undefined,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    });

    revalidatePath("/admin/inventory");
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error: supabaseErrorMessage(e, "Failed to create inventory item"),
    };
  }
}

// --- Release polishes + recipe lines ---

export type CreateReleasePolishResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

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
    const sort_order =
      sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) {
      return { ok: false, error: "Sort order must be a number" };
    }

    const row = await createReleasePolish(releaseId, { name, sort_order });

    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath(`/admin/releases/${releaseId}/polishes/new`);
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
    const sort_order =
      sortRaw === "" || sortRaw == null ? 0 : Number(sortRaw);
    if (Number.isNaN(sort_order)) {
      return { ok: false, error: "Sort order must be a number" };
    }

    await updateReleasePolish(polishId, { name, sort_order });

    revalidatePath(`/admin/releases/${releaseId}`);
    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to delete polish") };
  }
}

export type RecipeLineResult = { ok: true } | { ok: false; error: string };

export async function createRecipeLineAction(formData: FormData): Promise<RecipeLineResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!releaseId || !polishId) return { ok: false, error: "Missing release or polish" };

    const polish = await getPolishById(polishId);
    if (!polish || polish.release_id !== releaseId) {
      return { ok: false, error: "Polish not found for this release" };
    }

    const ingredient_name = (formData.get("ingredient_name") as string)?.trim();
    if (!ingredient_name) return { ok: false, error: "Ingredient name is required" };

    const ozRaw = formData.get("amount_oz");
    const amount_oz = ozRaw === "" || ozRaw == null ? NaN : Number(ozRaw);
    if (Number.isNaN(amount_oz) || amount_oz < 0) {
      return { ok: false, error: "Amount (oz) must be a number ≥ 0" };
    }

    await createRecipeLine(polishId, { ingredient_name, amount_oz });

    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    revalidatePath(`/admin/releases/${releaseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to add ingredient") };
  }
}

export async function updateRecipeLineAction(formData: FormData): Promise<RecipeLineResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    const lineId = (formData.get("line_id") as string)?.trim();
    if (!releaseId || !polishId || !lineId) {
      return { ok: false, error: "Missing ids" };
    }

    const detail = await getPolishDetail(polishId, releaseId);
    if (!detail) return { ok: false, error: "Polish not found" };
    const line = detail.lines.find((l) => l.id === lineId);
    if (!line) return { ok: false, error: "Ingredient line not found" };

    const ingredient_name = (formData.get("ingredient_name") as string)?.trim();
    if (!ingredient_name) return { ok: false, error: "Ingredient name is required" };

    const ozRaw = formData.get("amount_oz");
    const amount_oz = ozRaw === "" || ozRaw == null ? NaN : Number(ozRaw);
    if (Number.isNaN(amount_oz) || amount_oz < 0) {
      return { ok: false, error: "Amount (oz) must be a number ≥ 0" };
    }

    const sortRaw = formData.get("sort_order");
    const sort_order =
      sortRaw === "" || sortRaw == null ? line.sort_order : Number(sortRaw);
    if (Number.isNaN(sort_order)) {
      return { ok: false, error: "Sort order must be a number" };
    }

    await updateRecipeLine(lineId, { ingredient_name, amount_oz, sort_order });

    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to update ingredient") };
  }
}

export async function deleteRecipeLineAction(formData: FormData): Promise<RecipeLineResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    const lineId = (formData.get("line_id") as string)?.trim();
    if (!releaseId || !polishId || !lineId) {
      return { ok: false, error: "Missing ids" };
    }

    const detail = await getPolishDetail(polishId, releaseId);
    if (!detail) return { ok: false, error: "Polish not found" };
    if (!detail.lines.some((l) => l.id === lineId)) {
      return { ok: false, error: "Ingredient line not found" };
    }

    await deleteRecipeLine(lineId);

    revalidatePath(`/admin/releases/${releaseId}/polishes/${polishId}`);
    revalidatePath(`/admin/releases/${releaseId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: supabaseErrorMessage(e, "Failed to remove ingredient") };
  }
}
