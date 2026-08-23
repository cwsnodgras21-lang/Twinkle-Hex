/**
 * Build Command Center queues from operational facts.
 * Prefer plain-language actions over vanity metrics.
 */

import { projectProductionPlan, type ProductionPlanDay } from "./production-plan";
import { evaluateReleaseRisk, isRdReviewDue } from "./release-risk";

export type AttentionItem = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

export type WorkQueueItem = {
  id: string;
  priority: number;
  action: string;
  detail: string;
  due?: string | null;
  href?: string;
  kind: "produce" | "rd" | "swatch" | "formula" | "marketing" | "other";
};

export type UpcomingReleaseSummary = {
  id: string;
  name: string;
  target_launch_date: string | null;
  production_complete_by: string | null;
  swatcher_send_by: string | null;
  polishCount: number;
  remainingBatches: number;
  atRisk: boolean;
  riskReasons: string[];
  progressLabel: string;
};

export type CommandCenterInput = {
  today: string;
  releases: Array<{
    id: string;
    name: string;
    status: string;
    target_launch_date: string | null;
    production_complete_by: string | null;
    swatcher_send_by: string | null;
    swatch_return_by: string | null;
    marketing_ready_by: string | null;
    polishCount: number;
    remainingBatches: number;
    missingFormulaCount: number;
    swatcherShipmentOverdue: boolean;
  }>;
  rdReviews: Array<{
    id: string;
    name: string;
    review_date: string | null;
    status: string;
  }>;
  maxBatchesPerDay?: number;
};

export type CommandCenterView = {
  attention: AttentionItem[];
  todayQueue: WorkQueueItem[];
  thisWeek: WorkQueueItem[];
  upcomingReleases: UpcomingReleaseSummary[];
  productionPlanByRelease: Array<{
    releaseId: string;
    releaseName: string;
    planDays: ProductionPlanDay[];
    explanation: string;
  }>;
};

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function buildCommandCenter(input: CommandCenterInput): CommandCenterView {
  const attention: AttentionItem[] = [];
  const todayQueue: WorkQueueItem[] = [];
  const thisWeek: WorkQueueItem[] = [];
  const weekEnd = addDays(input.today, 6);
  const upcomingReleases: UpcomingReleaseSummary[] = [];
  const productionPlanByRelease: CommandCenterView["productionPlanByRelease"] = [];

  const active = input.releases.filter((r) => r.status !== "archived" && r.status !== "launched");

  for (const release of active) {
    const risk = evaluateReleaseRisk({
      name: release.name,
      today: input.today,
      productionCompleteBy: release.production_complete_by,
      swatcherSendBy: release.swatcher_send_by,
      remainingProductionBatches: release.remainingBatches,
      maxBatchesPerDay: input.maxBatchesPerDay,
      swatcherShipmentOverdue: release.swatcherShipmentOverdue,
    });

    const done = Math.max(0, release.polishCount - release.remainingBatches);
    const progressLabel =
      release.polishCount === 0
        ? "No polishes assigned"
        : `${done}/${release.polishCount} produced`;

    upcomingReleases.push({
      id: release.id,
      name: release.name,
      target_launch_date: release.target_launch_date,
      production_complete_by: release.production_complete_by,
      swatcher_send_by: release.swatcher_send_by,
      polishCount: release.polishCount,
      remainingBatches: release.remainingBatches,
      atRisk: risk.atRisk,
      riskReasons: risk.reasons,
      progressLabel,
    });

    if (risk.atRisk) {
      attention.push({
        id: `risk-${release.id}`,
        severity: "critical",
        title: `${release.name} is at risk`,
        detail: risk.reasons.join(" "),
        href: `/admin/releases/${release.id}`,
      });
    }

    if (release.missingFormulaCount > 0) {
      attention.push({
        id: `formula-${release.id}`,
        severity: "warning",
        title: `${release.name}: formula missing`,
        detail: `${release.missingFormulaCount} polish${release.missingFormulaCount === 1 ? "" : "es"} still need a recipe before production.`,
        href: `/admin/releases/${release.id}`,
      });
      todayQueue.push({
        id: `formula-work-${release.id}`,
        priority: 20,
        action: `Finish formulas for ${release.name}`,
        detail: `${release.missingFormulaCount} missing`,
        due: release.production_complete_by,
        href: `/admin/releases/${release.id}`,
        kind: "formula",
      });
    }

    if (release.remainingBatches > 0 && release.production_complete_by) {
      const plan = projectProductionPlan({
        remainingBatches: release.remainingBatches,
        today: input.today,
        deadline: release.production_complete_by,
        maxBatchesPerDay: input.maxBatchesPerDay,
      });
      productionPlanByRelease.push({
        releaseId: release.id,
        releaseName: release.name,
        planDays: plan.days,
        explanation: plan.explanation,
      });

      const todayPlan = plan.days.find((d) => d.date === input.today);
      if (todayPlan && todayPlan.batches > 0) {
        todayQueue.push({
          id: `produce-today-${release.id}`,
          priority: risk.atRisk ? 5 : 10,
          action: `Make ${todayPlan.batches} batch${todayPlan.batches === 1 ? "" : "es"} for ${release.name}`,
          detail: plan.explanation,
          due: release.production_complete_by,
          href: `/admin/releases/${release.id}`,
          kind: "produce",
        });
      }

      for (const day of plan.days) {
        if (day.date > input.today && day.date <= weekEnd) {
          thisWeek.push({
            id: `produce-${release.id}-${day.date}`,
            priority: 30,
            action: `Make ${day.batches} batch${day.batches === 1 ? "" : "es"} for ${release.name}`,
            detail: `Scheduled ${day.date}`,
            due: day.date,
            href: `/admin/releases/${release.id}`,
            kind: "produce",
          });
        }
      }
    }

    if (
      release.swatcher_send_by &&
      release.swatcher_send_by <= weekEnd &&
      release.remainingBatches === 0
    ) {
      const item: WorkQueueItem = {
        id: `swatch-${release.id}`,
        priority: release.swatcher_send_by <= input.today ? 8 : 25,
        action: `Package swatcher shipments for ${release.name}`,
        detail: `Send by ${release.swatcher_send_by}`,
        due: release.swatcher_send_by,
        href: `/admin/swatchers?release=${release.id}`,
        kind: "swatch",
      };
      if (release.swatcher_send_by <= input.today) todayQueue.push(item);
      else thisWeek.push(item);
    }

    if (
      release.marketing_ready_by &&
      release.marketing_ready_by <= weekEnd &&
      release.marketing_ready_by >= input.today
    ) {
      thisWeek.push({
        id: `mkt-${release.id}`,
        priority: 40,
        action: `Marketing prep for ${release.name}`,
        detail: `Ready-by ${release.marketing_ready_by}`,
        due: release.marketing_ready_by,
        href: `/admin/releases/${release.id}`,
        kind: "marketing",
      });
    }
  }

  for (const rd of input.rdReviews) {
    if (rd.status !== "in_progress") continue;
    if (isRdReviewDue(rd.review_date, input.today)) {
      attention.push({
        id: `rd-${rd.id}`,
        severity: "warning",
        title: `R&D review due: ${rd.name}`,
        detail: `Review date ${rd.review_date}`,
        href: `/admin/rd/${rd.id}`,
      });
      todayQueue.push({
        id: `rd-work-${rd.id}`,
        priority: 15,
        action: `Review prototype ${rd.name}`,
        detail: `Review date ${rd.review_date}`,
        due: rd.review_date,
        href: `/admin/rd/${rd.id}`,
        kind: "rd",
      });
    } else if (rd.review_date && rd.review_date <= weekEnd) {
      thisWeek.push({
        id: `rd-week-${rd.id}`,
        priority: 35,
        action: `Review prototype ${rd.name}`,
        detail: `Review date ${rd.review_date}`,
        due: rd.review_date,
        href: `/admin/rd/${rd.id}`,
        kind: "rd",
      });
    }
  }

  todayQueue.sort((a, b) => a.priority - b.priority || (a.due ?? "").localeCompare(b.due ?? ""));
  thisWeek.sort((a, b) => (a.due ?? "").localeCompare(b.due ?? "") || a.priority - b.priority);
  upcomingReleases.sort((a, b) => {
    if (a.atRisk !== b.atRisk) return a.atRisk ? -1 : 1;
    return (a.target_launch_date ?? "9999").localeCompare(b.target_launch_date ?? "9999");
  });

  return {
    attention,
    todayQueue,
    thisWeek,
    upcomingReleases,
    productionPlanByRelease,
  };
}
