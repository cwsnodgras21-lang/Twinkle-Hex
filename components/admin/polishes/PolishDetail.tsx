"use client";

import { useState } from "react";
import type { Polish, PolishRecipeLine, ProductionBatch, SdsComplianceStatus } from "@/types/admin";
import { FormShell } from "@/components/admin";
import { PolishForm } from "./PolishForm";
import { RecipeEditor } from "./RecipeEditor";
import { PolishSwatch } from "./PolishSwatch";
import { MakeBatchPanel } from "@/components/admin/batches/MakeBatchPanel";
import { formatIngredientList } from "@/lib/ops/ingredient-list";

function formatOunces(oz: number): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(oz)} oz`;
}

interface PolishDetailProps {
  polish: Polish;
  lines: PolishRecipeLine[];
  batches?: ProductionBatch[];
  sds?: SdsComplianceStatus | null;
  estimatedCostPerBottle?: number | null;
  defaultFillOz?: number;
  sourcePrototypeName?: string | null;
}

export function PolishDetail({
  polish,
  lines,
  batches = [],
  sds = null,
  estimatedCostPerBottle = null,
  defaultFillOz,
  sourcePrototypeName,
}: PolishDetailProps) {
  const [editingPolish, setEditingPolish] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(false);
  const [copied, setCopied] = useState(false);
  const totalOz = lines.reduce((sum, l) => sum + l.amount_oz, 0);
  const ingredientList = formatIngredientList(
    lines.map((l) => ({ ingredient_name: l.ingredient_name, amount_oz: l.amount_oz }))
  );

  async function copyIngredientList() {
    try {
      await navigator.clipboard.writeText(ingredientList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <FormShell
        title="Polish"
        description={editingPolish ? "Update the name, swatch color, or sort order." : undefined}
        actions={
          !editingPolish ? (
            <button
              type="button"
              onClick={() => setEditingPolish(true)}
              className="px-4 py-2 min-h-[44px] text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Edit
            </button>
          ) : null
        }
      >
        {editingPolish ? (
          <PolishForm
            polish={polish}
            mode="edit"
            onSaved={() => setEditingPolish(false)}
            onCancel={() => setEditingPolish(false)}
          />
        ) : (
          <div className="flex items-center gap-4">
            <PolishSwatch colorHex={polish.color_hex} size="lg" />
            <div>
              <p className="text-xl font-semibold text-ink leading-snug">{polish.name}</p>
              <p className="text-sm text-ink/60">
                Formula v{polish.formula_version}
                {polish.is_core ? " · Core polish" : ""}
                {" · "}Sort {polish.sort_order}
                {polish.color_hex ? ` · ${polish.color_hex}` : ""}
              </p>
              {sourcePrototypeName || polish.source_prototype_id ? (
                <p className="text-sm text-ink/60 mt-1">
                  From prototype:{" "}
                  {polish.source_prototype_id ? (
                    <a
                      href={`/admin/prototypes/${polish.source_prototype_id}`}
                      className="text-teal hover:underline"
                    >
                      {sourcePrototypeName ?? "View prototype"}
                    </a>
                  ) : (
                    sourcePrototypeName
                  )}
                </p>
              ) : null}
              {estimatedCostPerBottle != null ? (
                <p className="text-sm text-ink/70 mt-1">
                  Est. cost per bottle:{" "}
                  <span className="font-semibold text-ink tabular-nums">
                    ${estimatedCostPerBottle.toFixed(2)}
                  </span>
                </p>
              ) : null}
              {polish.notes && <p className="text-sm text-ink/70 mt-2 max-w-prose">{polish.notes}</p>}
            </div>
          </div>
        )}
      </FormShell>

      {sds ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            sds.ok
              ? "border-teal/30 bg-teal/5 text-ink"
              : "border-magenta/40 bg-magenta/5 text-ink"
          }`}
        >
          <p className="font-medium">{sds.ok ? "SDS compliance" : "SDS warning"}</p>
          <p className="mt-0.5 text-ink/80">{sds.summary}</p>
        </div>
      ) : null}

      <FormShell
        title="Recipe"
        description={
          editingRecipe
            ? "Edit all ingredients, then save once. Amounts are in ounces. Saving bumps the formula version."
            : lines.length > 0
              ? `${lines.length} ingredient${lines.length === 1 ? "" : "s"} · ${formatOunces(totalOz)} total · v${polish.formula_version}`
              : "Ingredients and how much of each (ounces)."
        }
        actions={
          !editingRecipe ? (
            <button
              type="button"
              onClick={() => setEditingRecipe(true)}
              className="px-4 py-2 min-h-[44px] text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Edit recipe
            </button>
          ) : null
        }
      >
        {editingRecipe ? (
          <RecipeEditor
            key={lines.map((l) => l.id).join("-") || "empty"}
            polishId={polish.id}
            initialLines={lines}
            onCancel={() => setEditingRecipe(false)}
            onSaved={() => setEditingRecipe(false)}
          />
        ) : lines.length === 0 ? (
          <p className="text-sm text-ink/60 py-8 text-center border border-dashed border-ink/15 rounded-lg">
            No ingredients yet. Use <strong>Edit recipe</strong> to add them.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-4 py-3.5 text-sm hover:bg-ink/[0.02] transition-colors"
              >
                <span className="text-ink font-medium pr-4">{line.ingredient_name}</span>
                <span className="text-teal font-semibold tabular-nums sm:text-right shrink-0">
                  {formatOunces(line.amount_oz)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormShell>

      {lines.length > 0 ? (
        <FormShell
          title="Ingredient list"
          description="Simple copyable list for subscription / collaboration-box reporting."
        >
          <p className="text-sm text-ink/80 leading-relaxed border border-ink/10 rounded-lg px-4 py-3 bg-ink/[0.02]">
            {ingredientList}
          </p>
          <button
            type="button"
            onClick={copyIngredientList}
            className="mt-3 px-4 py-2 text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            {copied ? "Copied" : "Copy list"}
          </button>
        </FormShell>
      ) : null}

      <FormShell
        title="Make batch"
        description={`Record bulk ounces and bottles filled. Completing freezes formula v${polish.formula_version}, assigns a lot number, and consumes inventory once.`}
      >
        <MakeBatchPanel
          polishId={polish.id}
          polishName={polish.name}
          formulaVersion={polish.formula_version}
          lines={lines}
          estimatedCostPerBottle={estimatedCostPerBottle}
          defaultFillOz={defaultFillOz}
        />
      </FormShell>

      {batches.length > 0 ? (
        <FormShell
          title="Batch history"
          description="Lot numbers, frozen formulas, bottles filled, and remaining bulk."
        >
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
            {batches.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm space-y-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-ink tabular-nums">
                    {b.lot_number ?? "No lot #"}
                  </span>
                  <span className="text-ink/50">
                    {b.completed_at
                      ? new Date(b.completed_at).toLocaleString()
                      : b.planned_date ?? "—"}
                  </span>
                </div>
                <p className="text-ink/70">
                  {b.total_bulk_oz} oz bulk · {b.bottles_filled} bottles ·{" "}
                  {b.bulk_remaining_oz != null
                    ? `${b.bulk_remaining_oz} oz remaining`
                    : "remaining n/a"}{" "}
                  · formula v{b.formula_version} · {b.status}
                  {b.estimated_cost_per_bottle != null
                    ? ` · ~$${b.estimated_cost_per_bottle.toFixed(2)}/bottle`
                    : ""}
                  {b.inventory_consumed_at ? " · inventory applied" : ""}
                </p>
              </li>
            ))}
          </ul>
        </FormShell>
      ) : null}
    </div>
  );
}
