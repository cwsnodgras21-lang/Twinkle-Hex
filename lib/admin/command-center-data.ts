/**
 * Assemble Command Center + ops calendar from live tables.
 * Graceful empty state when migration 013 is not yet applied.
 */

import { listReleases, countRemainingBatchesForRelease } from "@/lib/admin/releases";
import { listRdPrototypes } from "@/lib/admin/rd";
import { isSwatcherShipmentOverdue, listSwatcherAssignments } from "@/lib/admin/swatchers";
import { listRecentBatches } from "@/lib/admin/batches";
import { listCalendarNotes } from "@/lib/admin/calendar-notes";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import { buildCommandCenter, type CommandCenterView } from "@/lib/ops/command-center";
import { buildOpsCalendar, type CalendarEvent } from "@/lib/ops/calendar";
import { todayDateString } from "@/lib/admin/supabase-write";

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function loadCommandCenter(today = todayDateString()): Promise<CommandCenterView> {
  const settings = await getOpsSettings();

  let releases: Awaited<ReturnType<typeof listReleases>> = [];
  let rd: Awaited<ReturnType<typeof listRdPrototypes>> = [];
  try {
    releases = await listReleases();
  } catch {
    releases = [];
  }
  try {
    rd = await listRdPrototypes();
  } catch {
    rd = [];
  }

  const releaseInputs = [];
  for (const r of releases) {
    let polishCount = 0;
    let remainingBatches = 0;
    let missingFormulaCount = 0;
    let swatcherShipmentOverdue = false;
    try {
      const counts = await countRemainingBatchesForRelease(r.id);
      polishCount = counts.polishCount;
      remainingBatches = counts.remainingBatches;
      missingFormulaCount = counts.missingFormulaCount;
      swatcherShipmentOverdue = await isSwatcherShipmentOverdue(r.id, today);
      // Also treat overdue if release send-by passed and production incomplete
      if (!swatcherShipmentOverdue && r.swatcher_send_by && r.swatcher_send_by < today && remainingBatches > 0) {
        swatcherShipmentOverdue = true;
      }
    } catch {
      // ignore per-release failures
    }
    releaseInputs.push({
      id: r.id,
      name: r.name,
      status: r.status,
      target_launch_date: r.target_launch_date ?? null,
      production_complete_by: r.production_complete_by ?? null,
      swatcher_send_by: r.swatcher_send_by ?? null,
      swatch_return_by: r.swatch_return_by ?? null,
      marketing_ready_by: r.marketing_ready_by ?? null,
      polishCount,
      remainingBatches,
      missingFormulaCount,
      swatcherShipmentOverdue,
    });
  }

  return buildCommandCenter({
    today,
    releases: releaseInputs,
    rdReviews: rd.map((p) => ({
      id: p.id,
      name: p.name,
      review_date: p.review_date ?? null,
      status: p.status,
    })),
    maxBatchesPerDay: settings.max_batches_per_day,
  });
}

export async function loadOpsCalendar(daysAhead = 90): Promise<CalendarEvent[]> {
  const today = todayDateString();
  const to = addDays(today, daysAhead);
  const from = addDays(today, -7);

  let releases: Awaited<ReturnType<typeof listReleases>> = [];
  let rd: Awaited<ReturnType<typeof listRdPrototypes>> = [];
  let batches: Awaited<ReturnType<typeof listRecentBatches>> = [];
  let notes: Awaited<ReturnType<typeof listCalendarNotes>> = [];

  try {
    releases = await listReleases();
  } catch {
    /* empty */
  }
  try {
    rd = await listRdPrototypes();
  } catch {
    /* empty */
  }
  try {
    batches = await listRecentBatches(100);
  } catch {
    /* empty */
  }
  try {
    notes = await listCalendarNotes(from, to);
  } catch {
    /* empty */
  }

  return buildOpsCalendar({
    from,
    to,
    releases: releases.map((r) => ({
      id: r.id,
      name: r.name,
      target_launch_date: r.target_launch_date ?? null,
      production_complete_by: r.production_complete_by ?? null,
      swatcher_send_by: r.swatcher_send_by ?? null,
      swatch_return_by: r.swatch_return_by ?? null,
      marketing_ready_by: r.marketing_ready_by ?? null,
    })),
    rdReviews: rd.map((p) => ({
      id: p.id,
      name: p.name,
      review_date: p.review_date ?? null,
      status: p.status,
    })),
    batches: batches.map((b) => ({
      id: b.id,
      polish_name: b.polish_name ?? "Polish",
      planned_date: b.planned_date ?? null,
      status: b.status,
    })),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      item_date: n.item_date,
      kind: n.kind,
      release_id: n.release_id,
    })),
  });
}

export async function loadSwatcherOverdueFlags(today = todayDateString()) {
  try {
    const assignments = await listSwatcherAssignments();
    return assignments.filter(
      (a) => a.status === "planned" && a.send_by && a.send_by < today && !a.sent_at
    );
  } catch {
    return [];
  }
}
