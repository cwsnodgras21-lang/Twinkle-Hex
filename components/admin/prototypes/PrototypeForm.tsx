"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PolishPrototype, PolishPrototypeLine, PolishPrototypeStatus } from "@/types/admin";
import { createPolishPrototypeAction, updatePolishPrototypeAction } from "@/app/admin/ops-actions";
import { getErrorMessage } from "@/lib/errors";

type Row = { key: string; ingredient_name: string; amount_oz: string };

function rowsFromLines(lines: PolishPrototypeLine[]): Row[] {
  return lines.map((l) => ({
    key: l.id,
    ingredient_name: l.ingredient_name,
    amount_oz: String(l.amount_oz),
  }));
}

const STATUS_OPTIONS: { value: PolishPrototypeStatus; label: string }[] = [
  { value: "testing", label: "Testing" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

interface PrototypeFormProps {
  prototype?: (PolishPrototype & { lines: PolishPrototypeLine[] }) | null;
  mode: "create" | "edit";
}

/**
 * Polish prototype (15 mL development formula) create/edit form.
 * Formula lines save together with the prototype in one submit, mirroring
 * how RecipeEditor scopes a polish's ingredients — but inline here since
 * there is no separate prototype-lines route.
 */
export function PrototypeForm({ prototype, mode }: PrototypeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => (prototype ? rowsFromLines(prototype.lines) : []));
  const field =
    "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal";

  function addRow() {
    setRows((r) => [...r, { key: crypto.randomUUID(), ingredient_name: "", amount_oz: "" }]);
  }

  function removeRow(key: string) {
    setRows((r) => r.filter((x) => x.key !== key));
  }

  function updateRow(key: string, f: "ingredient_name" | "amount_oz", value: string) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [f]: value } : x)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const lines: Array<{ ingredient_name: string; amount_oz: number }> = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.ingredient_name.trim();
      const ozRaw = row.amount_oz.trim();
      const oz = ozRaw === "" ? NaN : Number(ozRaw);
      if (name === "" && ozRaw === "") continue;
      if (name === "" && ozRaw !== "") {
        setError(`Formula line ${i + 1}: add an ingredient name or clear the amount.`);
        return;
      }
      if (name !== "" && (Number.isNaN(oz) || oz < 0)) {
        setError(`Formula line ${i + 1}: enter a valid amount in ounces (≥ 0).`);
        return;
      }
      if (name) lines.push({ ingredient_name: name, amount_oz: oz });
    }

    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("lines_json", JSON.stringify(lines));
      if (mode === "create") {
        const result = await createPolishPrototypeAction(formData);
        if (result.ok && result.id) {
          router.push(`/admin/prototypes/${result.id}`);
          router.refresh();
        } else if (!result.ok) {
          setError(result.error);
        }
      } else if (prototype) {
        const result = await updatePolishPrototypeAction(prototype.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Prototype name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={prototype?.name}
          className={field}
          placeholder="e.g. Deep Sea #6"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="created_date" className="block text-sm font-medium text-ink mb-1">
            Created date
          </label>
          <input
            id="created_date"
            name="created_date"
            type="date"
            defaultValue={prototype?.created_date ?? new Date().toISOString().slice(0, 10)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="target_size_ml" className="block text-sm font-medium text-ink mb-1">
            Target size (mL)
          </label>
          <input
            id="target_size_ml"
            name="target_size_ml"
            type="number"
            min="0"
            step="0.1"
            defaultValue={prototype?.target_size_ml ?? 15}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select id="status" name="status" defaultValue={prototype?.status ?? "testing"} className={field}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={prototype?.notes}
          className={field}
          placeholder="Mix ratios, cure quirks, inspiration…"
        />
      </div>

      <div>
        <label htmlFor="observations" className="block text-sm font-medium text-ink mb-1">
          Observations
        </label>
        <textarea
          id="observations"
          name="observations"
          rows={3}
          defaultValue={prototype?.observations}
          className={field}
          placeholder="Application notes, dry time, shimmer behavior…"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-ink">Formula lines</label>
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 text-sm border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Add line
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-ink/50 py-4 border border-dashed border-ink/15 rounded-lg text-center">
            No formula lines yet — tap <strong>Add line</strong>.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border border-ink/10 rounded-lg p-3 bg-ink/[0.02]"
              >
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1">Ingredient {index + 1}</label>
                  <input
                    type="text"
                    value={row.ingredient_name}
                    onChange={(e) => updateRow(row.key, "ingredient_name", e.target.value)}
                    className={field}
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
                    className={field}
                    placeholder="0"
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

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Saving…" : mode === "create" ? "Create prototype" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
