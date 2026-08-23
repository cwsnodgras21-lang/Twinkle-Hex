"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPolishToReleaseAction } from "@/app/admin/ops-actions";

export function AddPolishToReleaseForm({
  releaseId,
  polishes,
}: {
  releaseId: string;
  polishes: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (polishes.length === 0) {
    return <p className="text-sm text-ink/50">All existing polishes are already on this release.</p>;
  }

  return (
    <form
      className="flex flex-wrap gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("release_id", releaseId);
        setError(null);
        startTransition(async () => {
          const result = await addPolishToReleaseAction(fd);
          if (result.ok) router.refresh();
          else setError(result.error);
        });
      }}
    >
      <div className="flex-1 min-w-[12rem]">
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="polish_id">
          Add polish
        </label>
        <select
          id="polish_id"
          name="polish_id"
          required
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        >
          <option value="">Select…</option>
          {polishes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error ? <p className="w-full text-sm text-magenta">{error}</p> : null}
    </form>
  );
}
