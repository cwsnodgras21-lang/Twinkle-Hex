import type { Release, ReleaseStatus } from "@/types/admin";
import { ReleaseCard } from "./ReleaseCard";
import { RELEASE_STATUSES } from "@/types/admin";

interface ReleaseKanbanProps {
  releases: Release[];
  statusFilter?: ReleaseStatus | null;
}

const STATUS_LABELS: Record<string, string> = {
  concept: "Concept",
  formula_development: "Formula Dev",
  testing: "Testing",
  swatcher_phase: "Swatcher",
  photography: "Photography",
  marketing: "Marketing",
  launch_ready: "Launch Ready",
  live: "Live",
  archived: "Archived",
};

export function ReleaseKanban({ releases, statusFilter }: ReleaseKanbanProps) {
  const statuses = [...RELEASE_STATUSES];
  const filteredReleases = statusFilter
    ? releases.filter((r) => r.status === statusFilter)
    : releases;

  const byStatus = statuses.reduce<Record<string, Release[]>>((acc, s) => {
    acc[s] = filteredReleases.filter((r) => r.status === s);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const items = byStatus[status] ?? [];
        return (
          <div
            key={status}
            className="flex-shrink-0 w-64 bg-ink/5 rounded-lg border border-ink/10 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-ink/10 bg-white/50">
              <h3 className="text-sm font-medium text-ink">
                {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
              </h3>
              <p className="text-xs text-ink/60">{items.length} release{items.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {items.map((r) => (
                <ReleaseCard key={r.id} release={r} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
