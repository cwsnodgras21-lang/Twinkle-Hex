"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { resolveRdAction } from "@/app/admin/ops-actions";

export function RdResolveButtons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={pending}
        className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50"
        onClick={() => {
          startTransition(async () => {
            await resolveRdAction(id, "approved");
            router.refresh();
          });
        }}
      >
        Approve for production
      </button>
      <button
        type="button"
        disabled={pending}
        className="px-4 py-2 border border-magenta/40 text-magenta rounded-lg disabled:opacity-50"
        onClick={() => {
          startTransition(async () => {
            await resolveRdAction(id, "rejected");
            router.refresh();
          });
        }}
      >
        Reject
      </button>
    </div>
  );
}
