"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Polish } from "@/types/admin";
import { createPolishAction, deletePolishAction, updatePolishAction } from "@/app/admin/actions";
import { PolishSwatch } from "./PolishSwatch";

interface PolishFormProps {
  polish?: Polish | null;
  mode: "create" | "edit";
  onSaved?: () => void;
  onCancel?: () => void;
}

export function PolishForm({ polish, mode, onSaved, onCancel }: PolishFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [colorHex, setColorHex] = useState(polish?.color_hex ?? "");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      if (mode === "create") {
        const result = await createPolishAction(formData);
        if (result.ok) {
          router.push(`/admin/polishes/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (polish) {
        const result = await updatePolishAction(polish.id, formData);
        if (result.ok) {
          onSaved?.();
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!polish || !window.confirm(`Delete “${polish.name}” and its recipe? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await deletePolishAction(polish.id);
      if (result.ok) {
        router.push("/admin/polishes");
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
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        <div>
          <label htmlFor="polish-name" className="block text-sm font-medium text-ink mb-1">
            Polish name *
          </label>
          <input
            id="polish-name"
            name="name"
            type="text"
            required
            defaultValue={polish?.name}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="e.g. Still Too Cold To Swim"
          />
        </div>

        <div>
          <label htmlFor="polish-color" className="block text-sm font-medium text-ink mb-1">
            Swatch color
          </label>
          <div className="flex items-center gap-3">
            <PolishSwatch colorHex={colorHex} size="lg" />
            <input
              id="polish-color"
              name="color_hex"
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
              placeholder="#cb508f"
            />
            <input
              type="color"
              aria-label="Pick swatch color"
              value={/^#[0-9a-fA-F]{6}$/.test(colorHex) ? colorHex : "#cb508f"}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-11 h-11 rounded-lg border border-ink/20 cursor-pointer shrink-0"
            />
          </div>
          <p className="mt-1 text-xs text-ink/50">Optional — used for the swatch chip on lists.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="polish-sort" className="block text-sm font-medium text-ink mb-1">
              Sort order
            </label>
            <input
              id="polish-sort"
              name="sort_order"
              type="number"
              defaultValue={polish?.sort_order ?? 0}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            />
          </div>
        </div>

        <div>
          <label htmlFor="polish-notes" className="block text-sm font-medium text-ink mb-1">
            Notes
          </label>
          <textarea
            id="polish-notes"
            name="notes"
            rows={2}
            defaultValue={polish?.notes}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
            placeholder="Cure time, finish notes, formulation quirks…"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 min-h-[44px] bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "Saving…" : mode === "create" ? "Create polish" : "Save"}
          </button>
          {mode === "edit" && onCancel && (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="px-4 py-2 min-h-[44px] border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {mode === "edit" && polish && (
        <div className="pt-4 border-t border-ink/10">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="px-4 py-2 min-h-[44px] border border-magenta/30 text-magenta rounded-lg hover:bg-magenta/5 disabled:opacity-50 text-sm transition-colors"
          >
            Delete polish
          </button>
        </div>
      )}
    </div>
  );
}
