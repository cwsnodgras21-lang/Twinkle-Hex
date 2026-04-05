import Link from "next/link";
import type { Release } from "@/types/admin";
import { StatusBadge } from "../StatusBadge";

interface ReleaseCardProps {
  release: Release;
}

const statusVariant: Record<string, "success" | "info" | "neutral" | "warning"> = {
  live: "success",
  launch_ready: "info",
  concept: "neutral",
  archived: "neutral",
};

function getVariant(status: string) {
  return statusVariant[status] ?? "neutral";
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <Link
      href={`/admin/releases/${release.id}`}
      className="block p-3 bg-white border border-ink/10 rounded-lg hover:border-teal/30 hover:shadow-sm transition-colors"
    >
      <p className="font-medium text-ink truncate">{release.name}</p>
      {release.collection && (
        <p className="text-xs text-ink/60 mt-0.5 truncate">{release.collection}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge label={release.status.replace(/_/g, " ")} variant={getVariant(release.status)} />
        {release.target_launch_date && (
          <span className="text-xs text-ink/60">
            {new Date(release.target_launch_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
