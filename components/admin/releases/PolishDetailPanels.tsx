"use client";

import { useState } from "react";
import type { PolishRecipeLine, ReleasePolish } from "@/types/admin";
import { FormShell } from "@/components/admin";
import { PolishForm } from "./PolishForm";
import { RecipeBatchEditor } from "./RecipeBatchEditor";

function formatOunces(oz: number): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(oz)} oz`;
}

interface PolishDetailPanelsProps {
  releaseId: string;
  polish: ReleasePolish;
  lines: PolishRecipeLine[];
}

export function PolishDetailPanels({ releaseId, polish, lines }: PolishDetailPanelsProps) {
  const [editingPolish, setEditingPolish] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(false);

  return (
    <div className="space-y-8">
      <FormShell
        title="Polish"
        description={
          editingPolish
            ? "Update the name or sort order."
            : "Name as it appears in release and polish lists."
        }
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
            releaseId={releaseId}
            polish={polish}
            mode="edit"
            onSaved={() => setEditingPolish(false)}
            onCancel={() => setEditingPolish(false)}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-xl font-semibold text-ink leading-snug">{polish.name}</p>
            <p className="text-sm text-ink/60">Sort order: {polish.sort_order}</p>
          </div>
        )}
      </FormShell>

      <FormShell
        title="Recipe"
        description={
          editingRecipe
            ? "Edit all ingredients, then save once. Amounts are in ounces."
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
          <RecipeBatchEditor
            key={lines.map((l) => l.id).join("-") || "empty"}
            releaseId={releaseId}
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
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-4 py-3.5 text-sm"
              >
                <span className="text-ink font-medium pr-4">{line.ingredient_name}</span>
                <span className="text-ink/70 tabular-nums sm:text-right shrink-0">
                  {formatOunces(line.amount_oz)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormShell>
    </div>
  );
}
