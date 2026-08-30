"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ingredient } from "@/types/admin";
import type { PackagingBomWithLines } from "@/lib/admin/packaging";
import { savePackagingBomAction } from "@/app/admin/ops-actions";
import { getErrorMessage } from "@/lib/errors";

type Row = { key: string; ingredient_id: string; quantity_per_bottle: string };

function rowsFromBom(bom: PackagingBomWithLines): Row[] {
  return bom.lines.map((l) => ({
    key: l.id,
    ingredient_id: l.ingredient_id,
    quantity_per_bottle: String(l.quantity_per_bottle),
  }));
}

interface PackagingBomEditorProps {
  bom: PackagingBomWithLines | null;
  supplies: Ingredient[];
}

/**
 * Finished-bottle packaging BOM — supplies (bottles, caps, labels) consumed
 * per bottle. Kept separate from polish formulas.
 */
export function PackagingBomEditor({ bom, supplies }: PackagingBomEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(bom?.name ?? "Default packaging");
  const [rows, setRows] = useState<Row[]>(() => (bom ? rowsFromBom(bom) : []));

  function addRow() {
    setRows((r) => [
      ...r,
      { key: crypto.randomUUID(), ingredient_id: supplies[0]?.id ?? "", quantity_per_bottle: "1" },
    ]);
  }

  function removeRow(key: string) {
    setRows((r) => r.filter((x) => x.key !== key));
  }

  function updateRow(key: string, field: "ingredient_id" | "quantity_per_bottle", value: string) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }

  async function handleSave() {
    if (!bom) {
      setError("No packaging BOM found — apply migration 016 first.");
      return;
    }
    setError(null);
    setMessage(null);

    const lines: Array<{ ingredient_id: string; quantity_per_bottle: number }> = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.ingredient_id) {
        setError(`Line ${i + 1}: choose a supply.`);
        return;
      }
      const qty = Number(row.quantity_per_bottle);
      if (!Number.isFinite(qty) || qty < 0) {
        setError(`Line ${i + 1}: enter a valid quantity (≥ 0).`);
        return;
      }
      lines.push({ ingredient_id: row.ingredient_id, quantity_per_bottle: qty });
    }

    setPending(true);
    try {
      const formData = new FormData();
      formData.set("bom_id", bom.id);
      formData.set("name", name.trim() || bom.name);
      formData.set("lines_json", JSON.stringify(lines));
      const result = await savePackagingBomAction(formData);
      if (result.ok) {
        setMessage("Packaging BOM saved");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (!bom) {
    return (
      <p className="text-sm text-ink/60 border border-dashed border-ink/15 rounded-lg px-4 py-8 text-center">
        No packaging BOM found yet — apply migration 016 to create the default bill of materials, then
        reload this page.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="text-sm text-magenta border border-magenta/30 bg-magenta/5 rounded-lg px-3 py-2">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-teal border border-teal/30 bg-teal/5 rounded-lg px-3 py-2">{message}</p>
      ) : null}

      <div>
        <label htmlFor="bom-name" className="block text-sm font-medium text-ink mb-1">
          BOM name
        </label>
        <input
          id="bom-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-md border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-ink">Supplies per bottle</label>
          <button
            type="button"
            onClick={addRow}
            disabled={supplies.length === 0}
            className="px-3 py-1.5 text-sm border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
          >
            Add line
          </button>
        </div>
        {supplies.length === 0 ? (
          <p className="text-sm text-ink/50 mb-2">No supplies in inventory yet — add supply ingredients first.</p>
        ) : null}
        {rows.length === 0 ? (
          <p className="text-sm text-ink/50 py-4 border border-dashed border-ink/15 rounded-lg text-center">
            No lines yet — tap <strong>Add line</strong>.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end border border-ink/10 rounded-lg p-3 bg-ink/[0.02]"
              >
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Supply {index + 1}</label>
                  <select
                    value={row.ingredient_id}
                    onChange={(e) => updateRow(row.key, "ingredient_id", e.target.value)}
                    className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
                  >
                    {!supplies.some((s) => s.id === row.ingredient_id) && row.ingredient_id ? (
                      <option value={row.ingredient_id}>Unknown supply</option>
                    ) : null}
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Qty / bottle</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={row.quantity_per_bottle}
                    onChange={(e) => updateRow(row.key, "quantity_per_bottle", e.target.value)}
                    className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="px-3 py-2 text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? "Saving…" : "Save packaging BOM"}
      </button>
    </div>
  );
}
