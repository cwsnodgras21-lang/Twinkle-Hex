/**
 * Pigment SDS compliance for production formulas.
 * Google Drive links are the preferred valid SDS; legacy storage uploads also count.
 */

import type { IngredientMsdsDocument, SdsComplianceStatus } from "@/types/admin";

export type PigmentRef = {
  ingredient_id?: string | null;
  name: string;
  category?: string | null;
};

export function documentCountsAsValidSds(doc: Pick<IngredientMsdsDocument, "source" | "google_drive_file_id" | "storage_path">): boolean {
  if (doc.source === "google_drive" && doc.google_drive_file_id) return true;
  if (doc.source === "supabase_storage" && doc.storage_path) return true;
  // Prefer Drive, but any linked SDS still satisfies "present"
  if (doc.google_drive_file_id || doc.storage_path) return true;
  return false;
}

export function evaluateSdsCompliance(
  pigments: PigmentRef[],
  docsByIngredientId: Map<string, Array<Pick<IngredientMsdsDocument, "source" | "google_drive_file_id" | "storage_path">>>
): SdsComplianceStatus {
  // Deduplicate by ingredient_id when present; otherwise by name
  const seen = new Map<string, PigmentRef>();
  for (const p of pigments) {
    if (p.category && p.category !== "pigment") continue;
    const key = p.ingredient_id || `name:${p.name.trim().toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, p);
  }

  const list = Array.from(seen.values());
  const missing: SdsComplianceStatus["missing"] = [];
  let withSds = 0;

  for (const p of list) {
    let ok = false;
    if (p.ingredient_id) {
      const docs = docsByIngredientId.get(p.ingredient_id) ?? [];
      ok = docs.some(documentCountsAsValidSds);
    }
    if (ok) withSds += 1;
    else missing.push({ ingredient_id: p.ingredient_id ?? undefined, name: p.name });
  }

  const pigment_count = list.length;
  const ok = missing.length === 0;
  const summary =
    pigment_count === 0
      ? "No linked pigments in formula"
      : ok
        ? `${withSds} of ${pigment_count} pigment SDS files present`
        : `${withSds} of ${pigment_count} pigment SDS files present · Missing SDS: ${missing.map((m) => m.name).join(", ")}`;

  return {
    pigment_count,
    with_sds_count: withSds,
    missing,
    ok,
    summary,
  };
}
