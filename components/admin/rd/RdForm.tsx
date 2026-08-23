"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRdAction } from "@/app/admin/ops-actions";

export function RdForm({
  ingredients,
}: {
  ingredients: Array<{ id: string; name: string; lifecycle_status: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const field =
    "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40";

  return (
    <form
      className="space-y-4 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const result = await createRdAction(new FormData(e.currentTarget));
        setPending(false);
        if (result.ok && result.id) {
          router.push(`/admin/rd/${result.id}`);
          router.refresh();
        } else if (!result.ok) {
          setError(result.error);
        }
      }}
    >
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Prototype name *
        </label>
        <input id="name" name="name" required className={field} placeholder="Deep Sea #6" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="ingredient_id">
          Pigment / ingredient under test
        </label>
        <select id="ingredient_id" name="ingredient_id" className={field} defaultValue="">
          <option value="">None</option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.lifecycle_status})
            </option>
          ))}
        </select>
        <p className="text-xs text-ink/50 mt-1">
          Linking a tracked ingredient marks it experimental until you approve or reject this prototype.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="start_date">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={field}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="review_date">
            Review date
          </label>
          <input id="review_date" name="review_date" type="date" className={field} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="observation_notes">
          Observation notes
        </label>
        <textarea id="observation_notes" name="observation_notes" rows={3} className={field} />
      </div>
      <button type="submit" disabled={pending} className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50">
        {pending ? "Saving…" : "Start prototype"}
      </button>
    </form>
  );
}
