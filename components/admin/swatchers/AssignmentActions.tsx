"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteAssignmentAction,
  markAssignmentReturnedAction,
  markAssignmentSentAction,
} from "@/app/admin/ops-actions";

export function AssignmentActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 text-sm">
      {status === "planned" ? (
        <button
          type="button"
          disabled={pending}
          className="text-teal hover:underline"
          onClick={() =>
            startTransition(async () => {
              await markAssignmentSentAction(id);
              router.refresh();
            })
          }
        >
          Mark sent
        </button>
      ) : null}
      {status === "sent" ? (
        <button
          type="button"
          disabled={pending}
          className="text-teal hover:underline"
          onClick={() =>
            startTransition(async () => {
              await markAssignmentReturnedAction(id);
              router.refresh();
            })
          }
        >
          Mark returned
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        className="text-magenta hover:underline"
        onClick={() =>
          startTransition(async () => {
            await deleteAssignmentAction(id);
            router.refresh();
          })
        }
      >
        Delete
      </button>
    </div>
  );
}
