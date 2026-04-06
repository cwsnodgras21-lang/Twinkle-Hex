"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Release, ReleaseStatus } from "@/types/admin";
import { RELEASE_STATUSES } from "@/types/admin";
import {
  createReleaseAction,
  deleteReleaseAction,
  updateReleaseAction,
} from "@/app/admin/actions";

const STATUS_LABELS: Record<string, string> = {
  concept: "Concept",
  formula_development: "Formula development",
  testing: "Testing",
  swatcher_phase: "Swatcher phase",
  photography: "Photography",
  marketing: "Marketing",
  launch_ready: "Launch ready",
  live: "Live",
  archived: "Archived",
};

interface ReleaseFormProps {
  release?: Release | null;
  mode: "create" | "edit";
}

export function ReleaseForm({ release, mode }: ReleaseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const statuses = [...RELEASE_STATUSES];

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      if (mode === "create") {
        const result = await createReleaseAction(formData);
        if (result.ok) {
          router.push(`/admin/releases/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (release) {
        const result = await updateReleaseAction(release.id, formData);
        if (result.ok) {
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
    if (
      !release ||
      !window.confirm(
        `Delete “${release.name}”? All polishes and recipes under this release will be removed. Finished inventory linked to this release will keep stock but lose the release link. This cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("release_id", release.id);
      const result = await deleteReleaseAction(fd);
      if (result.ok) {
        router.push("/admin/releases");
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
      <form
        id="release-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={release?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Spring 2025 Collection"
        />
      </div>
      <div>
        <label htmlFor="collection" className="block text-sm font-medium text-ink mb-1">
          Collection
        </label>
        <input
          id="collection"
          name="collection"
          type="text"
          defaultValue={release?.collection}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Seasonal, Limited Edition"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={release?.description}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Brief description of the release"
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={release?.status ?? "concept"}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="target_launch_date" className="block text-sm font-medium text-ink mb-1">
          Target launch date
        </label>
        <input
          id="target_launch_date"
          name="target_launch_date"
          type="date"
          defaultValue={release?.target_launch_date ?? undefined}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={release?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Internal notes"
        />
      </div>
      {release && <input type="hidden" name="id" value={release.id} />}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 min-h-[44px] bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
      </form>

    {mode === "edit" && release && (
      <div className="pt-4 border-t border-ink/10">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="px-4 py-2 min-h-[44px] border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
        >
          Delete collection / release
        </button>
        <p className="mt-2 text-xs text-ink/50 max-w-lg">
          Deletes this release and every polish (and recipe) tied to it. Inventory items only clear their
          release link.
        </p>
      </div>
    )}
    </div>
  );
}
