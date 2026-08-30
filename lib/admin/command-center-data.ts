/**
 * Assemble Command Center + ops calendar from live tables.
 * Graceful empty state when migration 013 is not yet applied.
 */

import { listReleases, countRemainingBatchesForRelease } from "@/lib/admin/releases";
import { listRdPrototypes } from "@/lib/admin/rd";
import { isSwatcherShipmentOverdue, listSwatcherAssignments } from "@/lib/admin/swatchers";
import { listRecentBatches } from "@/lib/admin/batches";
import { listCalendarNotes } from "@/lib/admin/calendar-notes";
import { listDailyTasks } from "@/lib/admin/daily-tasks";
import { getOpsSettings } from "@/lib/admin/ops-settings";
import { buildCommandCenter, type CommandCenterView } from "@/lib/ops/command-center";
import { buildOpsCalendar, type CalendarEvent } from "@/lib/ops/calendar";
import { todayDateString } from "@/lib/admin/supabase-write";
import type { DailyTask } from "@/types/admin";

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
      photo_upload_by: r.photo_upload_by ?? null,
      collaboration_program: r.collaboration_program ?? null,
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

export type DashboardStat = {
  value: string;
  label: string;
  sub: string;
  tone: "pink" | "purple" | "danger" | "neutral";
};

export type DashboardMonth = { year: number; month: number; label: string };

export type DashboardAtRiskItem = { name: string; detail: string; level: "HIGH" | "MEDIUM" };

export type DashboardSwatcherRow = {
  name: string;
  collection: string;
  due: string;
  status: "Planned" | "Sent" | "Returned";
};

export type DashboardData = {
  today: string;
  stats: DashboardStat[];
  atRisk: DashboardAtRiskItem[];
  months: DashboardMonth[];
  events: CalendarEvent[];
  tasks: DailyTask[];
  swatchers: DashboardSwatcherRow[];
};

const SWATCHER_STATUS_LABEL: Record<string, DashboardSwatcherRow["status"]> = {
  planned: "Planned",
  sent: "Sent",
  returned: "Returned",
};

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function loadDashboardData(today = todayDateString()): Promise<DashboardData> {
  const cc = await loadCommandCenter(today);
  const events = await loadOpsCalendar(97);

  const [y, m] = today.split("-").map(Number);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const months: DashboardMonth[] = [0, 1, 2].map((offset) => {
    const idx = m - 1 + offset;
    const year = y + Math.floor(idx / 12);
    const month = ((idx % 12) + 12) % 12;
    return { year, month, label: monthNames[month] };
  });

  let batches: Awaited<ReturnType<typeof listRecentBatches>> = [];
  let rd: Awaited<ReturnType<typeof listRdPrototypes>> = [];
  let assignments: Awaited<ReturnType<typeof listSwatcherAssignments>> = [];
  let tasks: DailyTask[] = [];
  try {
    batches = await listRecentBatches(200);
  } catch {
    /* empty */
  }
  try {
    rd = await listRdPrototypes();
  } catch {
    /* empty */
  }
  try {
    assignments = await listSwatcherAssignments();
  } catch {
    /* empty */
  }
  try {
    tasks = await listDailyTasks(today, today);
  } catch {
    /* empty */
  }

  const inProductionCount = batches.filter((b) => b.status === "planned" || b.status === "in_progress").length;
  const activeReleaseCount = cc.upcomingReleases.length;
  const atRiskReleases = cc.upcomingReleases.filter((r) => r.atRisk);
  const rdInProgress = rd.filter((p) => p.status === "in_progress");
  const rdDueSoon = rdInProgress.filter((p) => p.review_date && p.review_date <= today).length;
  const weekEnd = addDays(today, 6);
  const weekTasks = tasks.filter((t) => t.item_date >= today && t.item_date <= weekEnd);
  const weekTasksDone = weekTasks.filter((t) => t.done).length;

  const stats: DashboardStat[] = [
    {
      value: String(inProductionCount),
      label: "Polishes in production",
      sub: `${batches.filter((b) => b.status === "completed").length} on track`,
      tone: "pink",
    },
    {
      value: String(activeReleaseCount),
      label: "Active releases",
      sub: `${cc.upcomingReleases.filter((r) => r.target_launch_date && r.target_launch_date <= addDays(today, 30)).length} this month`,
      tone: "purple",
    },
    {
      value: String(atRiskReleases.length),
      label: "At risk",
      sub: atRiskReleases.length > 0 ? "Needs attention" : "All clear",
      tone: "danger",
    },
    {
      value: String(rdInProgress.length),
      label: "In the lab",
      sub: `${rdDueSoon} ready to review`,
      tone: "neutral",
    },
    {
      value: String(weekTasks.length),
      label: "Tasks this week",
      sub: `${weekTasksDone} completed`,
      tone: "neutral",
    },
  ];

  const atRisk: DashboardAtRiskItem[] = atRiskReleases.map((r) => ({
    name: r.name,
    detail: r.riskReasons[0] ?? r.progressLabel,
    level: r.riskReasons.length > 1 ? "HIGH" : "MEDIUM",
  }));

  const swatchers: DashboardSwatcherRow[] = assignments
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => (a.send_by ?? "9999") < (b.send_by ?? "9999") ? -1 : 1)
    .slice(0, 6)
    .map((a) => ({
      name: a.swatcher_name ?? "Unknown swatcher",
      collection: a.release_name ?? "—",
      due: a.send_by ? formatShortDate(a.send_by) : "—",
      status: SWATCHER_STATUS_LABEL[a.status] ?? "Planned",
    }));

  return { today, stats, atRisk, months, events, tasks, swatchers };
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
