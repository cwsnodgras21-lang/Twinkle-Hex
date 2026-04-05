"use server";

/**
 * Admin server actions.
 * Wire forms to these when Supabase + auth are ready.
 * Future: requireAdmin() before mutations.
 */

import { revalidatePath } from "next/cache";
import {
  createRelease,
  updateRelease,
  type CreateReleaseInput,
} from "@/lib/admin/releases";
import { createFinishedInventoryItem } from "@/lib/admin/inventory";

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
