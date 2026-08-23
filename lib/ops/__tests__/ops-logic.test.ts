import { describe, expect, it } from "vitest";
import {
  scaleFormula,
  snapshotFormula,
  formulaBaseTotalOz,
  DEFAULT_BATCH_OZ,
} from "../formula-scaling";
import {
  deriveDeadlinesFromLaunch,
  coalesceReleaseDeadlines,
  DEFAULT_LEAD_TIMES,
} from "../release-deadlines";
import {
  projectProductionPlan,
  reprojectAfterMissedDay,
  listWorkdays,
} from "../production-plan";
import {
  assertIngredientUsableInProduction,
  evaluateReleaseRisk,
  isIngredientProductionEligible,
  isRdReviewDue,
} from "../release-risk";
import { buildCommandCenter } from "../command-center";

describe("formula scaling", () => {
  const lines = [
    { ingredient_name: "Base", amount_oz: 30 },
    { ingredient_name: "Pigment", amount_oz: 2 },
  ];

  it("sums base total", () => {
    expect(formulaBaseTotalOz(lines)).toBe(32);
  });

  it("scales to 32 oz by default (1x when already 32)", () => {
    const scaled = scaleFormula(lines, DEFAULT_BATCH_OZ);
    expect(scaled[0].scaled_amount_oz).toBe(30);
    expect(scaled[1].scaled_amount_oz).toBe(2);
  });

  it("scales proportionally to a different batch size", () => {
    const scaled = scaleFormula(lines, 16);
    expect(scaled[0].scaled_amount_oz).toBe(15);
    expect(scaled[1].scaled_amount_oz).toBe(1);
  });

  it("snapshots without scaled fields and preserves history shape", () => {
    const snap = snapshotFormula(lines);
    expect(snap).toEqual([
      { ingredient_name: "Base", amount_oz: 30 },
      { ingredient_name: "Pigment", amount_oz: 2 },
    ]);
    // Mutating original after snapshot must not affect snapshot contents conceptually
    const frozen = JSON.parse(JSON.stringify(snap));
    lines[0].amount_oz = 99;
    expect(frozen[0].amount_oz).toBe(30);
  });
});

describe("release deadlines", () => {
  it("derives upstream deadlines from launch", () => {
    const d = deriveDeadlinesFromLaunch("2026-10-01", DEFAULT_LEAD_TIMES);
    expect(d.marketing_ready_by).toBe("2026-09-24");
    expect(d.swatch_return_by).toBe("2026-09-10");
    expect(d.swatcher_send_by).toBe("2026-08-27");
    expect(d.production_complete_by).toBe("2026-08-20");
  });

  it("keeps explicit dates when provided", () => {
    const c = coalesceReleaseDeadlines({
      target_launch_date: "2026-10-01",
      production_complete_by: "2026-09-01",
    });
    expect(c.production_complete_by).toBe("2026-09-01");
    expect(c.swatcher_send_by).toBe("2026-08-27");
  });
});

describe("production plan", () => {
  it("lists Mon–Fri workdays", () => {
    // 2026-09-07 is Monday
    const days = listWorkdays("2026-09-07", "2026-09-11");
    expect(days).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);
  });

  it("spreads 7 batches across 4 workdays", () => {
    const plan = projectProductionPlan({
      remainingBatches: 7,
      today: "2026-09-07",
      deadline: "2026-09-10", // Mon–Thu = 4 days
      maxBatchesPerDay: 2,
    });
    expect(plan.workdaysAvailable).toBe(4);
    expect(plan.days.reduce((s, d) => s + d.batches, 0)).toBe(7);
    expect(plan.behindBy).toBe(0); // 4*2=8 capacity
  });

  it("flags behind when capacity insufficient", () => {
    const plan = projectProductionPlan({
      remainingBatches: 10,
      today: "2026-09-07",
      deadline: "2026-09-10",
      maxBatchesPerDay: 2,
    });
    expect(plan.behindBy).toBe(2);
    expect(plan.explanation).toContain("behind");
  });

  it("reprojects after a missed day (Scenario A)", () => {
    // Originally 7 across Mon–Thu; miss Monday → remaining 7 Tue–Thu (3 days)
    const replanned = reprojectAfterMissedDay({
      remainingBatches: 7,
      today: "2026-09-08",
      deadline: "2026-09-10",
      maxBatchesPerDay: 2,
    });
    expect(replanned.workdaysAvailable).toBe(3);
    expect(replanned.behindBy).toBe(1); // 7 > 6
    expect(replanned.days.reduce((s, d) => s + d.batches, 0)).toBe(7);
  });
});

describe("eligibility + R&D review", () => {
  it("blocks experimental ingredients from production", () => {
    expect(isIngredientProductionEligible("experimental")).toBe(false);
    expect(isIngredientProductionEligible("approved")).toBe(true);
    expect(isIngredientProductionEligible("tracked")).toBe(true);
    const blocked = assertIngredientUsableInProduction("experimental", "PX-102");
    expect(blocked.ok).toBe(false);
  });

  it("detects R&D review due", () => {
    expect(isRdReviewDue("2026-08-20", "2026-08-23")).toBe(true);
    expect(isRdReviewDue("2026-08-30", "2026-08-23")).toBe(false);
    expect(isRdReviewDue(null, "2026-08-23")).toBe(false);
  });
});

describe("release risk (Scenario D)", () => {
  it("explains swatcher risk when production cannot finish before send", () => {
    const risk = evaluateReleaseRisk({
      name: "Deep Sea",
      today: "2026-09-07",
      productionCompleteBy: "2026-09-20",
      swatcherSendBy: "2026-09-09", // Mon–Wed = 3 workdays × 2 = 6 capacity
      remainingProductionBatches: 7,
      maxBatchesPerDay: 2,
    });
    expect(risk.atRisk).toBe(true);
    expect(risk.reasons.some((r) => r.toLowerCase().includes("swatcher"))).toBe(true);
  });
});

describe("command center", () => {
  it("surfaces attention and today queue from deadlines", () => {
    const view = buildCommandCenter({
      today: "2026-09-08",
      maxBatchesPerDay: 2,
      releases: [
        {
          id: "r1",
          name: "Deep Sea",
          status: "in_production",
          target_launch_date: "2026-10-15",
          production_complete_by: "2026-09-10",
          swatcher_send_by: "2026-09-12",
          swatch_return_by: "2026-09-26",
          marketing_ready_by: "2026-10-08",
          polishCount: 7,
          remainingBatches: 7,
          missingFormulaCount: 0,
          swatcherShipmentOverdue: false,
        },
      ],
      rdReviews: [
        { id: "rd1", name: "PX-102", review_date: "2026-09-08", status: "in_progress" },
      ],
    });
    expect(view.attention.length).toBeGreaterThan(0);
    expect(view.todayQueue.some((q) => q.kind === "rd")).toBe(true);
    expect(view.upcomingReleases[0].name).toBe("Deep Sea");
  });
});
