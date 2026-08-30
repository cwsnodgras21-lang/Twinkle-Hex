"use server";

/**
 * Production OS server actions — releases, batches, R&D, swatchers, calendar.
 */

import { revalidatePath } from "next/cache";
import {
  addPolishToRelease,
  createRelease,
  deleteRelease,
  removePolishFromRelease,
  updateRelease,
  updateReleasePolishStatus,
} from "@/lib/admin/releases";
import { completeProductionBatch, createProductionBatch } from "@/lib/admin/batches";
import {
  createRdPrototype,
  deleteRdPrototype,
  resolveRdPrototype,
  updateRdPrototype,
} from "@/lib/admin/rd";
import {
  createPolishPrototype,
  deletePolishPrototype,
  deletePrototypePhoto,
  promotePrototypeToProduction,
  replacePrototypeLines,
  updatePolishPrototype,
  uploadPrototypePhoto,
  getPrototypePhotoSignedUrl,
} from "@/lib/admin/prototypes";
import { createRevenueEntry, deleteRevenueEntry } from "@/lib/admin/revenue";
import { getPackagingBomForPolish, replacePackagingBomLines, updatePackagingBom } from "@/lib/admin/packaging";
import {
  createSwatcher,
  createSwatcherAssignment,
  deleteSwatcherAssignment,
  updateSwatcherAssignment,
} from "@/lib/admin/swatchers";
import { createCalendarNote, deleteCalendarNote, toggleCalendarNoteDone } from "@/lib/admin/calendar-notes";
import { createDailyTask, deleteDailyTask, toggleDailyTask } from "@/lib/admin/daily-tasks";
import { todayDateString } from "@/lib/admin/supabase-write";
import type {
  ReleasePolishProductionStatus,
  ReleaseStatus,
  RdPrototypeStatus,
  PolishPrototypeStatus,
  RevenueSource,
} from "@/types/admin";
import { getErrorMessage } from "@/lib/errors";

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string };

function trimOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = (value as string | null)?.trim();
  return trimmed ? trimmed : null;
}

function revalidateOps(paths: string[] = []) {
  revalidatePath("/admin");
  revalidatePath("/admin/releases");
  revalidatePath("/admin/rd");
  revalidatePath("/admin/swatchers");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/polishes");
  for (const p of paths) revalidatePath(p);
}

// --- Releases ---

export async function createReleaseAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const programRaw = trimOrNull(formData.get("collaboration_program"));
    const release = await createRelease({
      name,
      description: trimOrNull(formData.get("description")),
      target_launch_date: trimOrNull(formData.get("target_launch_date")),
      production_complete_by: trimOrNull(formData.get("production_complete_by")),
      swatcher_send_by: trimOrNull(formData.get("swatcher_send_by")),
      swatch_return_by: trimOrNull(formData.get("swatch_return_by")),
      marketing_ready_by: trimOrNull(formData.get("marketing_ready_by")),
      photo_upload_by: trimOrNull(formData.get("photo_upload_by")),
      collaboration_program:
        programRaw === "LLB" || programRaw === "SOU" || programRaw === "LBOH" ? programRaw : null,
      notes: trimOrNull(formData.get("notes")),
      status: ((formData.get("status") as string) || "planned") as ReleaseStatus,
    });
    revalidateOps([`/admin/releases/${release.id}`]);
    return { ok: true, id: release.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create release") };
  }
}

export async function updateReleaseAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const programRaw = trimOrNull(formData.get("collaboration_program"));
    await updateRelease(id, {
      name: (formData.get("name") as string)?.trim() || undefined,
      description: trimOrNull(formData.get("description")),
      target_launch_date: trimOrNull(formData.get("target_launch_date")),
      production_complete_by: trimOrNull(formData.get("production_complete_by")),
      swatcher_send_by: trimOrNull(formData.get("swatcher_send_by")),
      swatch_return_by: trimOrNull(formData.get("swatch_return_by")),
      marketing_ready_by: trimOrNull(formData.get("marketing_ready_by")),
      photo_upload_by: trimOrNull(formData.get("photo_upload_by")),
      collaboration_program:
        programRaw === undefined
          ? undefined
          : programRaw === "LLB" || programRaw === "SOU" || programRaw === "LBOH"
            ? programRaw
            : null,
      notes: trimOrNull(formData.get("notes")),
      status: ((formData.get("status") as string) || undefined) as ReleaseStatus | undefined,
    });
    revalidateOps([`/admin/releases/${id}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update release") };
  }
}

export async function deleteReleaseAction(id: string): Promise<ActionResult> {
  try {
    await deleteRelease(id);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete release") };
  }
}

export async function addPolishToReleaseAction(formData: FormData): Promise<ActionResult> {
  try {
    const releaseId = (formData.get("release_id") as string)?.trim();
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!releaseId || !polishId) return { ok: false, error: "Release and polish are required" };
    await addPolishToRelease(releaseId, polishId);
    revalidateOps([`/admin/releases/${releaseId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to add polish") };
  }
}

export async function removePolishFromReleaseAction(
  releasePolishId: string,
  releaseId: string
): Promise<ActionResult> {
  try {
    await removePolishFromRelease(releasePolishId);
    revalidateOps([`/admin/releases/${releaseId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to remove polish") };
  }
}

export async function setReleasePolishStatusAction(
  releasePolishId: string,
  releaseId: string,
  status: ReleasePolishProductionStatus
): Promise<ActionResult> {
  try {
    await updateReleasePolishStatus(releasePolishId, status);
    revalidateOps([`/admin/releases/${releaseId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update status") };
  }
}

// --- Batches ---

export async function makeBatchAction(formData: FormData): Promise<ActionResult> {
  try {
    const polishId = (formData.get("polish_id") as string)?.trim();
    if (!polishId) return { ok: false, error: "Polish is required" };
    const sizeRaw = (formData.get("batch_size_oz") as string)?.trim();
    const bulkRaw = (formData.get("total_bulk_oz") as string)?.trim();
    const bottlesRaw = (formData.get("bottles_filled") as string)?.trim();
    const fillRaw = (formData.get("fill_oz_per_bottle") as string)?.trim();
    const batch_size_oz = sizeRaw ? Number(sizeRaw) : 32;
    const total_bulk_oz = bulkRaw ? Number(bulkRaw) : batch_size_oz;
    const bottles_filled = bottlesRaw ? Number(bottlesRaw) : 0;
    if (!Number.isFinite(batch_size_oz) || batch_size_oz <= 0) {
      return { ok: false, error: "Batch size must be a positive number" };
    }
    if (!Number.isFinite(total_bulk_oz) || total_bulk_oz <= 0) {
      return { ok: false, error: "Total bulk ounces must be a positive number" };
    }
    const complete_now = formData.get("complete_now") === "on" || formData.get("complete_now") === "true";
    const batch = await createProductionBatch({
      polish_id: polishId,
      release_id: trimOrNull(formData.get("release_id")),
      release_polish_id: trimOrNull(formData.get("release_polish_id")),
      batch_size_oz,
      total_bulk_oz,
      bottles_filled: Number.isFinite(bottles_filled) ? Math.max(0, Math.floor(bottles_filled)) : 0,
      fill_oz_per_bottle: fillRaw ? Number(fillRaw) : null,
      planned_date: trimOrNull(formData.get("planned_date")),
      notes: trimOrNull(formData.get("notes")),
      complete_now,
    });
    revalidateOps([`/admin/polishes/${polishId}`, "/admin/inventory"]);
    return {
      ok: true,
      id: batch.id,
      message: complete_now
        ? `Batch ${batch.lot_number ?? ""} completed`
        : `Batch ${batch.lot_number ?? ""} planned`,
    };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create batch") };
  }
}

export async function completeBatchAction(
  batchId: string,
  polishId: string,
  releasePolishId?: string
): Promise<ActionResult> {
  try {
    await completeProductionBatch(batchId, { releasePolishId });
    revalidateOps([`/admin/polishes/${polishId}`, "/admin/inventory"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to complete batch") };
  }
}

// --- R&D ---

export async function createRdAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const proto = await createRdPrototype({
      name,
      ingredient_id: trimOrNull(formData.get("ingredient_id")),
      start_date: trimOrNull(formData.get("start_date")) ?? undefined,
      review_date: trimOrNull(formData.get("review_date")),
      observation_notes: trimOrNull(formData.get("observation_notes")),
    });
    revalidateOps([`/admin/rd/${proto.id}`]);
    return { ok: true, id: proto.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create prototype") };
  }
}

export async function updateRdAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await updateRdPrototype(id, {
      name: (formData.get("name") as string)?.trim() || undefined,
      review_date: trimOrNull(formData.get("review_date")),
      observation_notes: trimOrNull(formData.get("observation_notes")),
      outcome_notes: trimOrNull(formData.get("outcome_notes")),
      status: ((formData.get("status") as string) || undefined) as RdPrototypeStatus | undefined,
    });
    revalidateOps([`/admin/rd/${id}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update prototype") };
  }
}

export async function resolveRdAction(
  id: string,
  outcome: "approved" | "rejected",
  formData?: FormData
): Promise<ActionResult> {
  try {
    await resolveRdPrototype(id, outcome, formData ? trimOrNull(formData.get("outcome_notes")) : null);
    revalidateOps([`/admin/rd/${id}`, "/admin/ingredients"]);
    return { ok: true, message: outcome === "approved" ? "Approved for production" : "Rejected" };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to resolve prototype") };
  }
}

export async function deleteRdAction(id: string): Promise<ActionResult> {
  try {
    await deleteRdPrototype(id);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete prototype") };
  }
}

// --- Swatchers ---

export async function createSwatcherAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const s = await createSwatcher({
      name,
      email: trimOrNull(formData.get("email")),
      social_handle: trimOrNull(formData.get("social_handle")),
      notes: trimOrNull(formData.get("notes")),
    });
    revalidateOps();
    return { ok: true, id: s.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create swatcher") };
  }
}

export async function createAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const swatcher_id = (formData.get("swatcher_id") as string)?.trim();
    const release_id = (formData.get("release_id") as string)?.trim();
    if (!swatcher_id || !release_id) return { ok: false, error: "Swatcher and release are required" };
    await createSwatcherAssignment({
      swatcher_id,
      release_id,
      polish_id: trimOrNull(formData.get("polish_id")),
      send_by: trimOrNull(formData.get("send_by")),
      expected_return_at: trimOrNull(formData.get("expected_return_at")),
      notes: trimOrNull(formData.get("notes")),
    });
    revalidateOps([`/admin/releases/${release_id}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create assignment") };
  }
}

export async function markAssignmentSentAction(id: string, sentAt?: string): Promise<ActionResult> {
  try {
    await updateSwatcherAssignment(id, {
      status: "sent",
      sent_at: sentAt ?? new Date().toISOString().slice(0, 10),
    });
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to mark sent") };
  }
}

export async function markAssignmentReturnedAction(id: string, returnedAt?: string): Promise<ActionResult> {
  try {
    await updateSwatcherAssignment(id, {
      status: "returned",
      returned_at: returnedAt ?? new Date().toISOString().slice(0, 10),
    });
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to mark returned") };
  }
}

export async function deleteAssignmentAction(id: string): Promise<ActionResult> {
  try {
    await deleteSwatcherAssignment(id);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete assignment") };
  }
}

// --- Calendar notes ---

export async function createCalendarNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const title = (formData.get("title") as string)?.trim();
    const item_date = (formData.get("item_date") as string)?.trim();
    if (!title || !item_date) return { ok: false, error: "Title and date are required" };
    await createCalendarNote({
      title,
      item_date,
      kind: ((formData.get("kind") as string) || "marketing") as "marketing" | "email" | "post" | "other",
      release_id: trimOrNull(formData.get("release_id")),
      notes: trimOrNull(formData.get("notes")),
    });
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create calendar note") };
  }
}

export async function toggleCalendarNoteAction(id: string, done: boolean): Promise<ActionResult> {
  try {
    await toggleCalendarNoteDone(id, done);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update note") };
  }
}

export async function deleteCalendarNoteAction(id: string): Promise<ActionResult> {
  try {
    await deleteCalendarNote(id);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete note") };
  }
}

// --- Today's Plan (daily tasks) ---

export async function createDailyTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const title = (formData.get("title") as string)?.trim();
    if (!title) return { ok: false, error: "Title is required" };
    await createDailyTask({
      title,
      tag: trimOrNull(formData.get("tag")),
      time_label: trimOrNull(formData.get("time_label")),
      item_date: trimOrNull(formData.get("item_date")) ?? todayDateString(),
    });
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create task") };
  }
}

export async function toggleDailyTaskAction(id: string, done: boolean): Promise<ActionResult> {
  try {
    await toggleDailyTask(id, done);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update task") };
  }
}

export async function deleteDailyTaskAction(id: string): Promise<ActionResult> {
  try {
    await deleteDailyTask(id);
    revalidateOps();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete task") };
  }
}

// --- Polish prototypes ---

export async function createPolishPrototypeAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const linesRaw = (formData.get("lines_json") as string)?.trim();
    let lines: Array<{ ingredient_name: string; amount_oz: number; ingredient_id?: string | null }> = [];
    if (linesRaw) {
      try {
        lines = JSON.parse(linesRaw);
      } catch {
        return { ok: false, error: "Invalid formula lines JSON" };
      }
    }
    const proto = await createPolishPrototype({
      name,
      created_date: trimOrNull(formData.get("created_date")) ?? undefined,
      target_size_ml: Number(formData.get("target_size_ml") || 15) || 15,
      notes: trimOrNull(formData.get("notes")),
      observations: trimOrNull(formData.get("observations")),
      status: ((formData.get("status") as string) || "testing") as PolishPrototypeStatus,
      lines,
    });
    revalidateOps([`/admin/prototypes/${proto.id}`, "/admin/prototypes"]);
    return { ok: true, id: proto.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to create polish prototype") };
  }
}

export async function updatePolishPrototypeAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await updatePolishPrototype(id, {
      name: (formData.get("name") as string)?.trim() || undefined,
      created_date: trimOrNull(formData.get("created_date")) ?? undefined,
      target_size_ml: formData.get("target_size_ml")
        ? Number(formData.get("target_size_ml"))
        : undefined,
      notes: trimOrNull(formData.get("notes")),
      observations: trimOrNull(formData.get("observations")),
      status: ((formData.get("status") as string) || undefined) as PolishPrototypeStatus | undefined,
    });
    const linesRaw = (formData.get("lines_json") as string)?.trim();
    if (linesRaw) {
      const lines = JSON.parse(linesRaw) as Array<{
        ingredient_name: string;
        amount_oz: number;
        ingredient_id?: string | null;
      }>;
      await replacePrototypeLines(id, lines);
    }
    revalidateOps([`/admin/prototypes/${id}`, "/admin/prototypes"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to update prototype") };
  }
}

export async function promotePrototypeAction(id: string, formData?: FormData): Promise<ActionResult> {
  try {
    const result = await promotePrototypeToProduction(id, {
      polish_id: formData ? trimOrNull(formData.get("polish_id")) : null,
      polish_name: formData ? trimOrNull(formData.get("polish_name")) : null,
      color_hex: formData ? trimOrNull(formData.get("color_hex")) : null,
    });
    revalidateOps([
      `/admin/prototypes/${id}`,
      `/admin/polishes/${result.polish_id}`,
      "/admin/polishes",
      "/admin/prototypes",
    ]);
    return { ok: true, id: result.polish_id, message: "Promoted to production formula" };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to promote prototype") };
  }
}

export async function uploadPrototypePhotoAction(
  prototypeId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a photo to upload" };
    }
    await uploadPrototypePhoto(prototypeId, file, trimOrNull(formData.get("caption")) ?? undefined);
    revalidateOps([`/admin/prototypes/${prototypeId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to upload photo") };
  }
}

export async function deletePrototypePhotoAction(
  photoId: string,
  prototypeId: string
): Promise<ActionResult> {
  try {
    await deletePrototypePhoto(photoId);
    revalidateOps([`/admin/prototypes/${prototypeId}`]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete photo") };
  }
}

export async function getPrototypePhotoUrlAction(
  photoId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const url = await getPrototypePhotoSignedUrl(photoId);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to get photo URL") };
  }
}

export async function deletePolishPrototypeAction(id: string): Promise<ActionResult> {
  try {
    await deletePolishPrototype(id);
    revalidateOps(["/admin/prototypes"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete prototype") };
  }
}

// --- Revenue ---

export async function createRevenueEntryAction(formData: FormData): Promise<ActionResult> {
  try {
    const amount = Number(formData.get("amount"));
    const source = (formData.get("source") as string)?.trim() as RevenueSource;
    const received_date = (formData.get("received_date") as string)?.trim();
    if (!received_date) return { ok: false, error: "Date received is required" };
    if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: "Valid amount required" };
    if (!["LLB", "SOU", "LBOH", "other"].includes(source)) {
      return { ok: false, error: "Source must be LLB, SOU, LBOH, or other" };
    }
    const entry = await createRevenueEntry({
      received_date,
      amount,
      source,
      payment_method: trimOrNull(formData.get("payment_method")) ?? "paypal",
      external_reference: trimOrNull(formData.get("external_reference")),
      notes: trimOrNull(formData.get("notes")),
    });
    revalidateOps(["/admin/revenue", "/admin"]);
    return { ok: true, id: entry.id };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to save revenue") };
  }
}

export async function deleteRevenueEntryAction(id: string): Promise<ActionResult> {
  try {
    await deleteRevenueEntry(id);
    revalidateOps(["/admin/revenue", "/admin"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to delete revenue entry") };
  }
}

// --- Packaging BOM ---

export async function savePackagingBomAction(formData: FormData): Promise<ActionResult> {
  try {
    const bomId = (formData.get("bom_id") as string)?.trim();
    if (!bomId) {
      const existing = await getPackagingBomForPolish(null);
      if (!existing) return { ok: false, error: "No packaging BOM found — apply migration 016" };
      return savePackagingBomAction(
        (() => {
          formData.set("bom_id", existing.id);
          return formData;
        })()
      );
    }
    const name = (formData.get("name") as string)?.trim();
    if (name) await updatePackagingBom(bomId, { name, notes: trimOrNull(formData.get("notes")) });
    const linesRaw = (formData.get("lines_json") as string)?.trim();
    if (linesRaw) {
      const lines = JSON.parse(linesRaw) as Array<{
        ingredient_id: string;
        quantity_per_bottle: number;
        notes?: string | null;
      }>;
      await replacePackagingBomLines(bomId, lines);
    }
    revalidateOps(["/admin/packaging", "/admin/polishes"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: getErrorMessage(e, "Failed to save packaging BOM") };
  }
}
