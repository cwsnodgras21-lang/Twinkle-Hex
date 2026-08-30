"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createReleaseAction } from "@/app/admin/ops-actions";

export function ReleaseForm({
  mode = "create",
  releaseId,
  defaults,
}: {
  mode?: "create" | "edit";
  releaseId?: string;
  defaults?: {
    name?: string;
    description?: string;
    status?: string;
    target_launch_date?: string;
    production_complete_by?: string;
    swatcher_send_by?: string;
    swatch_return_by?: string;
    marketing_ready_by?: string;
    photo_upload_by?: string;
    collaboration_program?: string;
    notes?: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result =
      mode === "edit" && releaseId
        ? await import("@/app/admin/ops-actions").then((m) => m.updateReleaseAction(releaseId, fd))
        : await createReleaseAction(fd);
    setPending(false);
    if (result.ok) {
      router.push(result.id ? `/admin/releases/${result.id}` : `/admin/releases/${releaseId}`);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  const field =
    "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal";

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      {error ? <p className="text-sm text-magenta bg-magenta/5 border border-magenta/30 rounded-lg px-3 py-2">{error}</p> : null}
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="name">
          Name *
        </label>
        <input id="name" name="name" required defaultValue={defaults?.name} className={field} placeholder="Deep Sea Collection" />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="target_launch_date">
          Target launch date
        </label>
        <input id="target_launch_date" name="target_launch_date" type="date" defaultValue={defaults?.target_launch_date} className={field} />
        <p className="text-xs text-ink/50 mt-1">
          Leaving upstream dates blank fills them from launch (prod 42d, swatcher send 35d, return 21d,
          photo upload 14d, marketing 7d).
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="collaboration_program">
          Collaboration / box program
        </label>
        <select
          id="collaboration_program"
          name="collaboration_program"
          defaultValue={defaults?.collaboration_program ?? ""}
          className={field}
        >
          <option value="">None (store / own)</option>
          <option value="LLB">LLB</option>
          <option value="SOU">SOU</option>
          <option value="LBOH">LBOH</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="production_complete_by">
            Production complete by
          </label>
          <input id="production_complete_by" name="production_complete_by" type="date" defaultValue={defaults?.production_complete_by} className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="swatcher_send_by">
            Swatcher send by
          </label>
          <input id="swatcher_send_by" name="swatcher_send_by" type="date" defaultValue={defaults?.swatcher_send_by} className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="swatch_return_by">
            Swatch return by
          </label>
          <input id="swatch_return_by" name="swatch_return_by" type="date" defaultValue={defaults?.swatch_return_by} className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="photo_upload_by">
            Photo upload by
          </label>
          <input id="photo_upload_by" name="photo_upload_by" type="date" defaultValue={defaults?.photo_upload_by} className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="marketing_ready_by">
            Marketing ready by
          </label>
          <input id="marketing_ready_by" name="marketing_ready_by" type="date" defaultValue={defaults?.marketing_ready_by} className={field} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={defaults?.status ?? "planned"} className={field}>
          <option value="planned">Planned</option>
          <option value="in_production">In production</option>
          <option value="swatching">Swatching</option>
          <option value="marketing">Marketing</option>
          <option value="launched">Launched</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" rows={2} defaultValue={defaults?.description} className={field} />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} defaultValue={defaults?.notes} className={field} />
      </div>
      <button type="submit" disabled={pending} className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50">
        {pending ? "Saving…" : mode === "create" ? "Create release" : "Save"}
      </button>
    </form>
  );
}
