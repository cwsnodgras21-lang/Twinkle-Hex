/**
 * SDS compliance helpers for polish formulas.
 */

import { getPolishDetail } from "@/lib/admin/polishes";
import { getIngredientById, listMsdsDocumentsForIngredients } from "@/lib/admin/ingredients";
import { evaluateSdsCompliance } from "@/lib/ops/sds-compliance";
import type { SdsComplianceStatus } from "@/types/admin";

export async function getPolishSdsCompliance(polishId: string): Promise<SdsComplianceStatus> {
  const detail = await getPolishDetail(polishId);
  if (!detail) {
    return {
      pigment_count: 0,
      with_sds_count: 0,
      missing: [],
      ok: true,
      summary: "Polish not found",
    };
  }

  const pigments: Array<{ ingredient_id?: string; name: string; category?: string }> = [];
  for (const line of detail.lines) {
    if (line.ingredient_id) {
      const ing = await getIngredientById(line.ingredient_id);
      if (ing?.category === "pigment") {
        pigments.push({ ingredient_id: ing.id, name: ing.name, category: "pigment" });
      }
    } else if (/pigment|mica|chrome|shimmer/i.test(line.ingredient_name)) {
      // Free-text pigment-like lines without a link still surface as missing SDS
      pigments.push({ name: line.ingredient_name, category: "pigment" });
    }
  }

  const ids = pigments.map((p) => p.ingredient_id).filter(Boolean) as string[];
  const docsMap = await listMsdsDocumentsForIngredients(ids);
  return evaluateSdsCompliance(pigments, docsMap);
}
