/**
 * Release risk + eligibility rules — transparent signals, no health scores.
 */

import { listWorkdays, DEFAULT_PRODUCTION_WEEKDAYS } from "./production-plan";

export type IngredientLifecycleStatus =
  | "tracked"
  | "experimental"
  | "approved"
  | "rejected"
  | "archived";

/** Experimental / rejected / archived must not be treated as production-ready. */
export function isIngredientProductionEligible(status: IngredientLifecycleStatus | string): boolean {
  return status === "approved" || status === "tracked";
}

export function assertIngredientUsableInProduction(
  status: IngredientLifecycleStatus | string,
  name?: string
): { ok: true } | { ok: false; reason: string } {
  if (isIngredientProductionEligible(status)) return { ok: true };
  const label = name ? `"${name}"` : "Ingredient";
  if (status === "experimental") {
    return {
      ok: false,
      reason: `${label} is experimental — approve it from R&D before using in production formulas.`,
    };
  }
  if (status === "rejected") {
    return { ok: false, reason: `${label} was rejected and cannot be used in production.` };
  }
  if (status === "archived") {
    return { ok: false, reason: `${label} is archived and cannot be used in production.` };
  }
  return { ok: false, reason: `${label} is not eligible for production (status: ${status}).` };
}

export function isRdReviewDue(reviewDate: string | null | undefined, today: string): boolean {
  if (!reviewDate) return false;
  return reviewDate <= today;
}

export type ReleaseRiskInput = {
  name: string;
  today: string;
  productionCompleteBy: string | null;
  swatcherSendBy: string | null;
  remainingProductionBatches: number;
  maxBatchesPerDay?: number;
  weekdays?: number[];
  /** True when any swatcher assignment send_by has passed without sent_at. */
  swatcherShipmentOverdue?: boolean;
};

export type ReleaseRisk = {
  atRisk: boolean;
  reasons: string[];
};

/**
 * Transparent risk: explain *why*, never invent a score.
 */
export function evaluateReleaseRisk(input: ReleaseRiskInput): ReleaseRisk {
  const reasons: string[] = [];
  const maxPerDay = input.maxBatchesPerDay ?? 2;
  const weekdays = input.weekdays ?? DEFAULT_PRODUCTION_WEEKDAYS;

  if (input.swatcherShipmentOverdue) {
    reasons.push("Swatcher shipment is overdue.");
  }

  if (
    input.swatcherSendBy &&
    input.remainingProductionBatches > 0 &&
    input.swatcherSendBy <= input.today
  ) {
    reasons.push(
      `Swatcher send date (${input.swatcherSendBy}) has passed with ${input.remainingProductionBatches} batch${input.remainingProductionBatches === 1 ? "" : "es"} still incomplete.`
    );
  }

  if (input.productionCompleteBy && input.remainingProductionBatches > 0) {
    if (input.productionCompleteBy < input.today) {
      reasons.push(
        `Production deadline (${input.productionCompleteBy}) has passed with ${input.remainingProductionBatches} batch${input.remainingProductionBatches === 1 ? "" : "es"} remaining.`
      );
    } else {
      const workdays = listWorkdays(input.today, input.productionCompleteBy, weekdays);
      const capacity = workdays.length * maxPerDay;
      if (input.remainingProductionBatches > capacity) {
        reasons.push(
          `${input.remainingProductionBatches} batches remain but only ${capacity} can fit before ${input.productionCompleteBy} at ${maxPerDay}/day.`
        );
      }

      // Swatcher timing threat: production complete-by after swatcher send, or
      // remaining work cannot finish before swatcher send.
      if (input.swatcherSendBy && input.swatcherSendBy >= input.today) {
        const daysToSend = listWorkdays(input.today, input.swatcherSendBy, weekdays);
        const sendCapacity = daysToSend.length * maxPerDay;
        if (input.remainingProductionBatches > sendCapacity) {
          reasons.push(
            `Swatcher shipment is due ${input.swatcherSendBy}; remaining production (${input.remainingProductionBatches}) cannot finish in time.`
          );
        }
      }
    }
  }

  return { atRisk: reasons.length > 0, reasons };
}
