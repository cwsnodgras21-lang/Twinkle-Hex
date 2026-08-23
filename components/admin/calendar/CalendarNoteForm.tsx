"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCalendarNoteAction } from "@/app/admin/ops-actions";

export function CalendarNoteForm({
  releases,
}: {
  releases: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const field =
    "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40";

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await createCalendarNoteAction(fd);
          if (result.ok) {
            e.currentTarget.reset();
            router.refresh();
          } else setError(result.error);
        });
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required className={field} placeholder="Email blast" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="item_date">
          Date
        </label>
        <input id="item_date" name="item_date" type="date" required className={field} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="kind">
          Kind
        </label>
        <select id="kind" name="kind" className={field} defaultValue="marketing">
          <option value="marketing">Marketing</option>
          <option value="email">Email</option>
          <option value="post">Post</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="release_id">
          Release
        </label>
        <select id="release_id" name="release_id" className={field} defaultValue="">
          <option value="">Optional</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="sm:col-span-2 text-sm text-magenta">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50 sm:col-span-2 lg:col-span-4 w-fit"
      >
        {pending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
