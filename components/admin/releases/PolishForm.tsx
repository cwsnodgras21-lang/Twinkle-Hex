"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReleasePolish } from "@/types/admin";
import {
  createReleasePolishAction,
  deleteReleasePolishAction,
  updateReleasePolishAction,
} from "@/app/admin/actions";

interface PolishFormProps {
  releaseId: string;
  polish?: ReleasePolish | null;
  mode: "create" | "edit";
  /** Called after a successful save in edit mode (e.g. close read/edit panel). */
  onSaved?: () => void;
  /** Shown next to Save in edit mode; discards without saving. */
  onCancel?: () => void;
}

export function PolishForm({ releaseId, polish, mode, onSaved, onCancel }: PolishFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      if (mode === "create") {
        const result = await createReleasePolishAction(formData);
        if (result.ok) {
          router.push(`/admin/releases/${releaseId}/polishes/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (polish) {
        const result = await updateReleasePolishAction(formData);
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
    if (!polish || !window.confirm(`Delete polish “${polish.name}” and its recipe? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("release_id", releaseId);
      fd.set("polish_id", polish.id);
      const result = await deleteReleasePolishAction(fd);
      if (result.ok) {
        router.push(`/admin/releases/${releaseId}`);
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <input type="hidden" name="release_id" value={releaseId} />
        {polish && <input type="hidden" name="polish_id" value={polish.id} />}
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
            className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px]"
            placeholder="e.g. Still Too Cold To Swim"
          />
        </div>
        <div>
          <label htmlFor="polish-sort" className="block text-sm font-medium text-ink mb-1">
            Sort order
          </label>
          <input
            id="polish-sort"
            name="sort_order"
            type="number"
            defaultValue={polish?.sort_order ?? 0}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 min-h-[44px] max-w-[12rem]"
          />
          <p className="mt-1 text-xs text-ink/50">Lower numbers appear first in the list.</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 min-h-[44px] bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
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
            className="px-4 py-2 min-h-[44px] border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
          >
            Delete polish
          </button>
        </div>
      )}
    </div>
  );
}
