"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Polish } from "@/types/admin";
import { promotePrototypeAction } from "@/app/admin/ops-actions";

interface PromotePrototypeButtonProps {
  prototypeId: string;
  prototypeName: string;
  polishes?: Polish[];
}

/**
 * Copies a prototype's formula lines into a production polish recipe.
 * Only rendered by the caller when status is "testing" or "selected".
 */
export function PromotePrototypeButton({
  prototypeId,
  prototypeName,
  polishes = [],
}: PromotePrototypeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [polishId, setPolishId] = useState("");
  const [polishName, setPolishName] = useState(prototypeName);
  const [colorHex, setColorHex] = useState("");

  function handlePromote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      if (polishId) fd.set("polish_id", polishId);
      if (polishName.trim()) fd.set("polish_name", polishName.trim());
      if (colorHex.trim()) fd.set("color_hex", colorHex.trim());
      const result = await promotePrototypeAction(prototypeId, fd);
      if (result.ok) {
        setMessage(result.message ?? "Promoted to production formula");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {message ? <p className="text-sm text-teal">{message}</p> : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Promote to Production Formula
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handlePromote} className="space-y-3 border border-teal/30 bg-teal/5 rounded-lg p-4 max-w-lg">
      <p className="text-sm text-ink/70">
        Copies this prototype&apos;s formula lines into a production polish recipe. Choose an existing
        polish to overwrite its recipe, or leave it as a new polish.
      </p>
      {error ? <p className="text-sm text-magenta">{error}</p> : null}
      {polishes.length > 0 ? (
        <div>
          <label htmlFor="target-polish" className="block text-sm font-medium text-ink mb-1">
            Target polish (optional)
          </label>
          <select
            id="target-polish"
            value={polishId}
            onChange={(e) => setPolishId(e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Create new polish</option>
            {polishes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="promote-name" className="block text-sm font-medium text-ink mb-1">
          Polish name
        </label>
        <input
          id="promote-name"
          type="text"
          value={polishName}
          onChange={(e) => setPolishName(e.target.value)}
          className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="promote-color" className="block text-sm font-medium text-ink mb-1">
          Swatch color (optional)
        </label>
        <input
          id="promote-color"
          type="text"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          placeholder="#cb508f"
          className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {pending ? "Promoting…" : "Confirm promote"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
