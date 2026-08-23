/**
 * Deterministic formula scaling.
 * Recipe lines are stored for a base total (sum of amount_oz).
 * Scale to a target batch size in ounces.
 */

export type FormulaLine = {
  ingredient_name: string;
  amount_oz: number;
  ingredient_id?: string | null;
};

export type ScaledFormulaLine = FormulaLine & {
  scaled_amount_oz: number;
};

export const DEFAULT_BATCH_OZ = 32;

export function formulaBaseTotalOz(lines: FormulaLine[]): number {
  return lines.reduce((sum, line) => sum + (Number(line.amount_oz) || 0), 0);
}

/**
 * Scale recipe lines to targetBatchOz.
 * If base total is 0, returns zeroed scaled amounts (caller should block batching).
 */
export function scaleFormula(
  lines: FormulaLine[],
  targetBatchOz: number = DEFAULT_BATCH_OZ
): ScaledFormulaLine[] {
  const base = formulaBaseTotalOz(lines);
  const factor = base > 0 ? targetBatchOz / base : 0;
  return lines.map((line) => ({
    ...line,
    amount_oz: Number(line.amount_oz) || 0,
    scaled_amount_oz: (Number(line.amount_oz) || 0) * factor,
  }));
}

/** Immutable snapshot suitable for production_batches.formula_snapshot */
export function snapshotFormula(lines: FormulaLine[]): FormulaLine[] {
  return lines.map((line) => ({
    ingredient_name: line.ingredient_name,
    amount_oz: Number(line.amount_oz) || 0,
    ...(line.ingredient_id ? { ingredient_id: line.ingredient_id } : {}),
  }));
}
