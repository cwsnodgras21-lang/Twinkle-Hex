"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  removePolishFromReleaseAction,
  setReleasePolishStatusAction,
} from "@/app/admin/ops-actions";
import type { ReleasePolishProductionStatus } from "@/types/admin";

const STATUSES: ReleasePolishProductionStatus[] = [
  "needed",
  "formula_ready",
  "batched",
  "complete",
];

export function ReleasePolishRowActions({
  releaseId,
  releasePolishId,
  status,
}: {
  releaseId: string;
  releasePolishId: string;
  status: ReleasePolishProductionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        disabled={pending}
        value={status}
        className="text-sm border border-ink/20 rounded-lg px-2 py-1"
        onChange={(e) => {
          const next = e.target.value as ReleasePolishProductionStatus;
          startTransition(async () => {
            await setReleasePolishStatusAction(releasePolishId, releaseId, next);
            router.refresh();
          });
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        className="text-sm text-magenta hover:underline"
        onClick={() => {
          startTransition(async () => {
            await removePolishFromReleaseAction(releasePolishId, releaseId);
            router.refresh();
          });
        }}
      >
        Remove
      </button>
    </div>
  );
}
