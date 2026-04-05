"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RELEASE_STATUSES } from "@/types/admin";

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

interface ReleaseListFiltersProps {
  currentStatus?: string;
  currentView?: "table" | "pipeline";
}

export function ReleaseListFilters({
  currentStatus,
  currentView = "pipeline",
}: ReleaseListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statuses = [...RELEASE_STATUSES];

  function setFilter(status: string, view?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all" || !status) {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    if (view) params.set("view", view);
    router.push(`/admin/releases?${params.toString()}`);
  }

  const hasFilters = currentStatus || currentView !== "pipeline";

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-ink/10">
      <span className="text-sm font-medium text-ink/70">Status:</span>
      <select
        value={currentStatus ?? "all"}
        onChange={(e) => setFilter(e.target.value)}
        className="text-sm border border-ink/20 rounded-lg px-3 py-1.5"
      >
        <option value="all">All</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s] ?? s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <span className="text-ink/30">|</span>
      <span className="text-sm font-medium text-ink/70">View:</span>
      <div className="flex rounded-lg border border-ink/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setFilter(currentStatus ?? "all", "pipeline")}
          className={`px-3 py-1.5 text-sm ${
            currentView === "pipeline"
              ? "bg-teal text-white"
              : "bg-white text-ink/70 hover:bg-ink/5"
          }`}
        >
          Pipeline
        </button>
        <button
          type="button"
          onClick={() => setFilter(currentStatus ?? "all", "table")}
          className={`px-3 py-1.5 text-sm ${
            currentView === "table"
              ? "bg-teal text-white"
              : "bg-white text-ink/70 hover:bg-ink/5"
          }`}
        >
          Table
        </button>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/admin/releases")}
          className="text-sm text-ink/60 hover:text-teal transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
