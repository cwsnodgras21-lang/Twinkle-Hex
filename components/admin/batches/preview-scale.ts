import { scaleFormula, type FormulaLine } from "@/lib/ops/formula-scaling";

/** Client-safe re-export of scaleFormula for the Make Batch panel. */
export function previewBatchClientScale(lines: FormulaLine[], targetOz: number) {
  return scaleFormula(lines, targetOz);
}
