"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PolishRecipeLine } from "@/types/admin";
import {
  createRecipeLineAction,
  deleteRecipeLineAction,
  updateRecipeLineAction,
} from "@/app/admin/actions";

interface RecipeLinesEditorProps {
  releaseId: string;
  polishId: string;
  lines: PolishRecipeLine[];
}

export function RecipeLinesEditor({ releaseId, polishId, lines }: RecipeLinesEditorProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [rowPending, setRowPending] = useState<string | null>(null);

  async function onAdd(formData: FormData) {
    setFormError(null);
    setAddPending(true);
    try {
      const result = await createRecipeLineAction(formData);
      if (result.ok) {
        router.refresh();
      } else {
        setFormError(result.error);
      }
    } finally {
      setAddPending(false);
    }
  }

  async function onUpdateLine(lineId: string, formData: FormData) {
    setFormError(null);
    setRowPending(lineId);
    try {
      const result = await updateRecipeLineAction(formData);
      if (result.ok) {
        router.refresh();
      } else {
        setFormError(result.error);
      }
    } finally {
      setRowPending(null);
    }
  }

  async function onDeleteLine(lineId: string, label: string) {
    if (!window.confirm(`Remove “${label}” from this recipe?`)) return;
    setFormError(null);
    setRowPending(lineId);
    try {
      const fd = new FormData();
      fd.set("release_id", releaseId);
      fd.set("polish_id", polishId);
      fd.set("line_id", lineId);
      const result = await deleteRecipeLineAction(fd);
      if (result.ok) {
        router.refresh();
      } else {
        setFormError(result.error);
      }
    } finally {
      setRowPending(null);
    }
  }

  return (
    <div className="space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {formError}
        </div>
      )}

      {lines.length === 0 ? (
        <p className="text-sm text-ink/60 py-4 text-center border border-dashed border-ink/15 rounded-lg">
          No ingredients yet. Add one below.
        </p>
      ) : (
        <ul className="space-y-4">
          {lines.map((line) => (
            <li
              key={line.id}
              className="border border-ink/10 rounded-lg p-3 md:p-4 space-y-3 bg-ink/[0.02]"
            >
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onUpdateLine(line.id, new FormData(e.currentTarget));
                }}
              >
                <input type="hidden" name="release_id" value={releaseId} />
                <input type="hidden" name="polish_id" value={polishId} />
                <input type="hidden" name="line_id" value={line.id} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">
                      Ingredient name
                    </label>
                    <input
                      name="ingredient_name"
                      type="text"
                      required
                      defaultValue={line.ingredient_name}
                      className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-1">
                      Amount (oz)
                    </label>
                    <input
                      name="amount_oz"
                      type="number"
                      required
                      min={0}
                      step="any"
                      defaultValue={line.amount_oz}
                      className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                    />
                  </div>
                </div>
                <div className="w-full sm:max-w-[8rem]">
                  <label className="block text-xs font-medium text-ink/70 mb-1">
                    Sort order
                  </label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={line.sort_order}
                    className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={rowPending === line.id}
                    className="px-3 py-2 min-h-[44px] text-sm bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {rowPending === line.id ? "Saving…" : "Save line"}
                  </button>
                  <button
                    type="button"
                    disabled={rowPending === line.id}
                    onClick={() => onDeleteLine(line.id, line.ingredient_name)}
                    className="px-3 py-2 min-h-[44px] text-sm border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-ink/10 pt-4">
        <h3 className="text-sm font-medium text-ink mb-3">Add ingredient</h3>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await onAdd(new FormData(e.currentTarget));
            e.currentTarget.reset();
          }}
        >
          <input type="hidden" name="release_id" value={releaseId} />
          <input type="hidden" name="polish_id" value={polishId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-ingredient-name" className="block text-xs font-medium text-ink/70 mb-1">
                Ingredient name *
              </label>
              <input
                id="new-ingredient-name"
                name="ingredient_name"
                type="text"
                required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                placeholder="e.g. TKB Blue"
              />
            </div>
            <div>
              <label htmlFor="new-amount-oz" className="block text-xs font-medium text-ink/70 mb-1">
                Amount (oz) *
              </label>
              <input
                id="new-amount-oz"
                name="amount_oz"
                type="number"
                required
                min={0}
                step="any"
                className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addPending}
            className="px-4 py-2 min-h-[44px] text-sm bg-ink text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {addPending ? "Adding…" : "Add ingredient"}
          </button>
        </form>
      </div>
    </div>
  );
}
