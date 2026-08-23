/**
 * Deterministic production workload → day-by-day plan.
 * No AI — pure arithmetic over remaining batches and workdays.
 */

export type ProductionPlanDay = {
  date: string;
  batches: number;
};

export type ProductionPlanResult = {
  remainingBatches: number;
  workdaysAvailable: number;
  behindBy: number;
  /** Ideal pace if remaining work were evenly spread across remaining workdays. */
  batchesPerWorkdayIdeal: number;
  days: ProductionPlanDay[];
  explanation: string;
};

/** ISO weekday: 1=Mon … 7=Sun (matches Postgres extract(isodow)). */
export const DEFAULT_PRODUCTION_WEEKDAYS = [1, 2, 3, 4, 5];

function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoWeekday(d: Date): number {
  const day = d.getUTCDay(); // 0=Sun
  return day === 0 ? 7 : day;
}

export function listWorkdays(
  fromInclusive: string,
  toInclusive: string,
  weekdays: number[] = DEFAULT_PRODUCTION_WEEKDAYS
): string[] {
  const allowed = new Set(weekdays);
  const out: string[] = [];
  const cur = parseDateOnly(fromInclusive);
  const end = parseDateOnly(toInclusive);
  if (cur.getTime() > end.getTime()) return out;

  while (cur.getTime() <= end.getTime()) {
    if (allowed.has(isoWeekday(cur))) {
      out.push(formatDateOnly(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Distribute remainingBatches across workdays from `today` through `deadline`.
 * If behind (more batches than workdays * maxPerDay), still schedules all remaining
 * work by front-loading up to a soft ceiling of maxPerDay, then overflowing.
 */
export function projectProductionPlan(input: {
  remainingBatches: number;
  today: string;
  deadline: string;
  weekdays?: number[];
  maxBatchesPerDay?: number;
}): ProductionPlanResult {
  const remaining = Math.max(0, Math.floor(input.remainingBatches));
  const maxPerDay = Math.max(1, input.maxBatchesPerDay ?? 2);
  const workdays = listWorkdays(input.today, input.deadline, input.weekdays);
  const workdaysAvailable = workdays.length;

  if (remaining === 0) {
    return {
      remainingBatches: 0,
      workdaysAvailable,
      behindBy: 0,
      batchesPerWorkdayIdeal: 0,
      days: [],
      explanation: "No remaining production batches.",
    };
  }

  if (workdaysAvailable === 0) {
    return {
      remainingBatches: remaining,
      workdaysAvailable: 0,
      behindBy: remaining,
      batchesPerWorkdayIdeal: remaining,
      days: [],
      explanation: `Production deadline has no remaining workdays; ${remaining} batch${remaining === 1 ? "" : "es"} still needed.`,
    };
  }

  const capacity = workdaysAvailable * maxPerDay;
  const behindBy = Math.max(0, remaining - capacity);
  const ideal = remaining / workdaysAvailable;

  // Even distribution with remainder front-loaded.
  const base = Math.floor(remaining / workdaysAvailable);
  let leftover = remaining % workdaysAvailable;
  const days: ProductionPlanDay[] = workdays.map((date) => {
    const extra = leftover > 0 ? 1 : 0;
    if (leftover > 0) leftover -= 1;
    return { date, batches: base + extra };
  });

  // If even spread exceeds maxPerDay, rebalance: fill maxPerDay from the front,
  // then overflow onto later days (and beyond capacity signal via behindBy).
  const over = days.some((d) => d.batches > maxPerDay);
  if (over) {
    let left = remaining;
    for (let i = 0; i < days.length; i++) {
      const take = Math.min(maxPerDay, left);
      days[i].batches = take;
      left -= take;
    }
    // If still leftover after filling all days at max, dump onto the last day
    // so the plan remains complete and transparent.
    if (left > 0 && days.length > 0) {
      days[days.length - 1].batches += left;
    }
  }

  const explanation =
    behindBy > 0
      ? `You are ${behindBy} batch${behindBy === 1 ? "" : "es"} behind capacity (${maxPerDay}/day × ${workdaysAvailable} workdays). Remaining ${remaining} must be completed by ${input.deadline}.`
      : `Spread ${remaining} batch${remaining === 1 ? "" : "es"} across ${workdaysAvailable} workday${workdaysAvailable === 1 ? "" : "s"} through ${input.deadline}.`;

  return {
    remainingBatches: remaining,
    workdaysAvailable,
    behindBy,
    batchesPerWorkdayIdeal: ideal,
    days: days.filter((d) => d.batches > 0),
    explanation,
  };
}

/**
 * Reproject after a missed day: remaining work, new today, same deadline.
 */
export function reprojectAfterMissedDay(input: {
  remainingBatches: number;
  today: string;
  deadline: string;
  weekdays?: number[];
  maxBatchesPerDay?: number;
}): ProductionPlanResult {
  return projectProductionPlan(input);
}
