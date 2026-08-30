/**
 * Approximate finished-bottle cost from formula + packaging.
 * Usable production costing — not full COGS accounting.
 */

export type CostIngredient = {
  ingredient_id?: string | null;
  ingredient_name: string;
  /** Amount in the same unit as unit_cost (typically oz for formula). */
  amount: number;
  unit_cost?: number | null;
  category?: string | null;
};

export type CostPackagingLine = {
  ingredient_id: string;
  name?: string;
  quantity_per_bottle: number;
  unit_cost?: number | null;
};

export type BottleCostBreakdown = {
  formula_cost: number;
  pigment_cost: number;
  packaging_cost: number;
  total_per_bottle: number;
  formula_lines: Array<{ name: string; amount: number; unit_cost: number; line_cost: number }>;
  packaging_lines: Array<{ name: string; quantity: number; unit_cost: number; line_cost: number }>;
};

/**
 * Resolve unit cost from explicit unit_cost or purchase_cost / purchase_quantity.
 */
export function resolveUnitCost(input: {
  unit_cost?: number | null;
  purchase_cost?: number | null;
  purchase_quantity?: number | null;
}): number | null {
  if (input.unit_cost != null && Number.isFinite(input.unit_cost) && input.unit_cost >= 0) {
    return Number(input.unit_cost);
  }
  const pc = input.purchase_cost != null ? Number(input.purchase_cost) : null;
  const pq = input.purchase_quantity != null ? Number(input.purchase_quantity) : null;
  if (pc != null && pq != null && pq > 0 && Number.isFinite(pc)) {
    return pc / pq;
  }
  return null;
}

/**
 * Cost of one finished bottle given scaled formula amounts for ONE bottle's
 * fill (fillOzPerBottle worth of bulk) plus packaging BOM lines.
 *
 * Pass formula lines already scaled to fill_oz_per_bottle (not full batch).
 */
export function estimateBottleCost(input: {
  formulaLinesForOneBottle: CostIngredient[];
  packagingLines: CostPackagingLine[];
}): BottleCostBreakdown {
  const formula_lines = input.formulaLinesForOneBottle.map((line) => {
    const unit_cost = line.unit_cost != null && Number.isFinite(line.unit_cost) ? Number(line.unit_cost) : 0;
    const amount = Number(line.amount) || 0;
    return {
      name: line.ingredient_name,
      amount,
      unit_cost,
      line_cost: amount * unit_cost,
      category: line.category ?? null,
    };
  });

  let formula_cost = 0;
  let pigment_cost = 0;
  for (const line of formula_lines) {
    if (line.category === "pigment") {
      pigment_cost += line.line_cost;
    } else {
      formula_cost += line.line_cost;
    }
  }

  const packaging_lines = input.packagingLines.map((line) => {
    const unit_cost = line.unit_cost != null && Number.isFinite(line.unit_cost) ? Number(line.unit_cost) : 0;
    const quantity = Number(line.quantity_per_bottle) || 0;
    return {
      name: line.name ?? line.ingredient_id,
      quantity,
      unit_cost,
      line_cost: quantity * unit_cost,
    };
  });

  const packaging_cost = packaging_lines.reduce((s, l) => s + l.line_cost, 0);
  const total_per_bottle = formula_cost + pigment_cost + packaging_cost;

  return {
    formula_cost: roundMoney(formula_cost),
    pigment_cost: roundMoney(pigment_cost),
    packaging_cost: roundMoney(packaging_cost),
    total_per_bottle: roundMoney(total_per_bottle),
    formula_lines: formula_lines.map(({ name, amount, unit_cost, line_cost }) => ({
      name,
      amount,
      unit_cost: roundMoney(unit_cost),
      line_cost: roundMoney(line_cost),
    })),
    packaging_lines: packaging_lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      unit_cost: roundMoney(l.unit_cost),
      line_cost: roundMoney(l.line_cost),
    })),
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 10000) / 10000;
}
