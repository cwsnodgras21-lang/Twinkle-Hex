"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { makeBatchAction } from "@/app/admin/ops-actions";
import { previewBatchClientScale } from "@/components/admin/batches/preview-scale";
import type { PolishRecipeLine } from "@/types/admin";
import { DEFAULT_BATCH_OZ } from "@/lib/ops/formula-scaling";

interface MakeBatchPanelProps {
  polishId: string;
  polishName: string;
  formulaVersion: number;
  lines: PolishRecipeLine[];
  releaseId?: string;
  releasePolishId?: string;
}

export function MakeBatchPanel({
  polishId,
  polishName,
  formulaVersion,
  lines,
  releaseId,
  releasePolishId,
}: MakeBatchPanelProps) {
  const router = useRouter();
  const [batchSize, setBatchSize] = useState(String(DEFAULT_BATCH_OZ));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sizeNum = Number(batchSize) || 0;
  const scaled = previewBatchClientScale(
    lines.map((l) => ({ ingredient_name: l.ingredient_name, amount_oz: l.amount_oz })),
    sizeNum > 0 ? sizeNum : DEFAULT_BATCH_OZ
  );

  function submit(completeNow: boolean) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("polish_id", polishId);
      fd.set("batch_size_oz", String(sizeNum > 0 ? sizeNum : DEFAULT_BATCH_OZ));
      if (releaseId) fd.set("release_id", releaseId);
      if (releasePolishId) fd.set("release_polish_id", releasePolishId);
      if (completeNow) fd.set("complete_now", "true");
      fd.set("planned_date", new Date().toISOString().slice(0, 10));
      const result = await makeBatchAction(fd);
      if (result.ok) {
        setMessage(result.message ?? "Saved");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-ink/60 border border-dashed border-ink/15 rounded-lg px-4 py-6 text-center">
        Add a recipe before making a batch of {polishName}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        Formula version <span className="font-medium text-ink">v{formulaVersion}</span> will be
        snapshotted onto the batch so later recipe edits cannot rewrite history.
      </p>

      <div className="max-w-xs">
        <label htmlFor="batch_size_oz" className="block text-sm font-medium text-ink mb-1">
          Batch size (oz)
        </label>
        <input
          id="batch_size_oz"
          type="number"
          min="0.1"
          step="0.1"
          value={batchSize}
          onChange={(e) => setBatchSize(e.target.value)}
          className="w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
        />
      </div>

      <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
        {scaled.map((line) => (
          <li
            key={line.ingredient_name + line.amount_oz}
            className="flex justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span className="text-ink">{line.ingredient_name}</span>
            <span className="text-teal font-semibold tabular-nums">
              {line.scaled_amount_oz.toLocaleString("en-US", {
                maximumFractionDigits: 4,
              })}{" "}
              oz
            </span>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="text-sm text-magenta border border-magenta/30 bg-magenta/5 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-teal border border-teal/30 bg-teal/5 rounded-lg px-3 py-2">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Complete batch now"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
        >
          Plan batch
        </button>
      </div>
    </div>
  );
}
