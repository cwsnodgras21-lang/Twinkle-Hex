"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAssignmentAction, createSwatcherAction } from "@/app/admin/ops-actions";

const field =
  "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40";

export function SwatcherForms({
  swatchers,
  releases,
  polishes,
  defaultReleaseId,
}: {
  swatchers: Array<{ id: string; name: string }>;
  releases: Array<{
    id: string;
    name: string;
    swatcher_send_by?: string;
    swatch_return_by?: string;
  }>;
  polishes: Array<{ id: string; name: string }>;
  defaultReleaseId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form
        className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createSwatcherAction(fd);
            if (result.ok) {
              e.currentTarget.reset();
              router.refresh();
            } else setError(result.error);
          });
        }}
      >
        <h2 className="font-semibold text-ink">Add swatcher</h2>
        <input name="name" required placeholder="Name *" className={field} />
        <input name="email" type="email" placeholder="Email" className={field} />
        <input name="social_handle" placeholder="Social handle" className={field} />
        <button type="submit" disabled={pending} className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50">
          Save swatcher
        </button>
      </form>

      <form
        className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createAssignmentAction(fd);
            if (result.ok) {
              e.currentTarget.reset();
              router.refresh();
            } else setError(result.error);
          });
        }}
      >
        <h2 className="font-semibold text-ink">Assign to release</h2>
        <select name="swatcher_id" required className={field} defaultValue="">
          <option value="">Swatcher *</option>
          {swatchers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="release_id" required className={field} defaultValue={defaultReleaseId ?? ""}>
          <option value="">Release *</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select name="polish_id" className={field} defaultValue="">
          <option value="">Polish (optional)</option>
          {polishes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="send_by" type="date" className={field} placeholder="Send by" />
        <input name="expected_return_at" type="date" className={field} />
        {error ? <p className="text-sm text-magenta">{error}</p> : null}
        <button type="submit" disabled={pending} className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50">
          Create assignment
        </button>
      </form>
    </>
  );
}
