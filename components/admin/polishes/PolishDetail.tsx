"use client";

import { useState } from "react";
import type { Polish, PolishRecipeLine, ProductionBatch } from "@/types/admin";
import { FormShell } from "@/components/admin";
import { PolishForm } from "./PolishForm";
import { RecipeEditor } from "./RecipeEditor";
import { PolishSwatch } from "./PolishSwatch";
import { MakeBatchPanel } from "@/components/admin/batches/MakeBatchPanel";

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
}

/**
 * The recipe lives ON the polish's own record — one page, not a separate
 * route — because "what is this polish" and "how is it made" are the same
 * question in practice.
 */
export function PolishDetail({ polish, lines, batches = [] }: PolishDetailProps) {
  const [editingPolish, setEditingPolish] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(false);
  const totalOz = lines.reduce((sum, l) => sum + l.amount_oz, 0);

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
              {polish.notes && <p className="text-sm text-ink/70 mt-2 max-w-prose">{polish.notes}</p>}
            </div>
          </div>
        )}
      </FormShell>

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

      <FormShell
        title="Make batch"
        description={`Default 32 oz. Completing a batch freezes formula v${polish.formula_version}.`}
      >
        <MakeBatchPanel
          polishId={polish.id}
          polishName={polish.name}
          formulaVersion={polish.formula_version}
          lines={lines}
        />
      </FormShell>

      {batches.length > 0 ? (
        <FormShell
          title="Batch history"
          description="Completed and planned batches with frozen formula versions."
        >
          <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
            {batches.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="text-ink">
                  {b.batch_size_oz} oz · formula v{b.formula_version} · {b.status}
                </span>
                <span className="text-ink/50">
                  {b.completed_at
                    ? new Date(b.completed_at).toLocaleDateString()
                    : b.planned_date ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </FormShell>
      ) : null}
    </div>
  );
}
