"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PolishRecipeLine } from "@/types/admin";
import { replacePolishRecipeAction } from "@/app/admin/actions";

type Row = { key: string; ingredient_name: string; amount_oz: string };

function rowsFromLines(lines: PolishRecipeLine[]): Row[] {
  return lines.map((l) => ({
    key: l.id,
    ingredient_name: l.ingredient_name,
    amount_oz: String(l.amount_oz),
  }));
}

interface RecipeBatchEditorProps {
  releaseId: string;
  polishId: string;
  initialLines: PolishRecipeLine[];
  onCancel: () => void;
  onSaved: () => void;
}

export function RecipeBatchEditor({
  releaseId,
  polishId,
  initialLines,
  onCancel,
  onSaved,
}: RecipeBatchEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => rowsFromLines(initialLines));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addRow() {
    setRows((r) => [...r, { key: crypto.randomUUID(), ingredient_name: "", amount_oz: "" }]);
  }

  function removeRow(key: string) {
    setRows((r) => r.filter((x) => x.key !== key));
  }

  function updateRow(key: string, field: "ingredient_name" | "amount_oz", value: string) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }

  async function save() {
    setError(null);
    const payload: { ingredient_name: string; amount_oz: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.ingredient_name.trim();
      const ozRaw = row.amount_oz.trim();
      const oz = ozRaw === "" ? NaN : Number(row.amount_oz);
      if (name === "" && ozRaw === "") continue;
      if (name === "" && ozRaw !== "") {
        setError(`Row ${i + 1}: add an ingredient name or clear the amount.`);
        return;
      }
      if (name !== "" && (Number.isNaN(oz) || oz < 0)) {
        setError(`Row ${i + 1}: enter a valid amount in ounces (≥ 0).`);
        return;
      }
      if (name) payload.push({ ingredient_name: name, amount_oz: oz });
    }

    setPending(true);
    try {
      const fd = new FormData();
      fd.set("release_id", releaseId);
      fd.set("polish_id", polishId);
      fd.set("recipe_json", JSON.stringify(payload));
      const result = await replacePolishRecipeAction(fd);
      if (result.ok) {
        onSaved();
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <p className="text-sm text-ink/60">
        Add or change lines, then use <strong>Save recipe</strong> once to apply everything.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/50 py-4 border border-dashed border-ink/15 rounded-lg text-center">
          No lines yet — tap <strong>Add line</strong> below.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border border-ink/10 rounded-lg p-3 bg-ink/[0.02]"
            >
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">
                  Ingredient {index + 1}
                </label>
                <input
                  type="text"
                  value={row.ingredient_name}
                  onChange={(e) => updateRow(row.key, "ingredient_name", e.target.value)}
                  className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1">Amount (oz)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={row.amount_oz}
                  onChange={(e) => updateRow(row.key, "amount_oz", e.target.value)}
                  className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="min-h-[44px] px-3 text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 min-h-[44px] text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
        >
          Add line
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="px-4 py-2 min-h-[44px] text-sm bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save recipe"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="px-4 py-2 min-h-[44px] text-sm border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
