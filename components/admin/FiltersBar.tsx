"use client";

import { ReactNode } from "react";

interface FiltersBarProps {
  children?: ReactNode;
  onClear?: () => void;
}

/**
 * Filters bar for list views.
 * Future: Search input, date range, status filter, sort dropdown.
 */
export function FiltersBar({ children, onClear }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-ink/10">
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink/60 hover:text-teal transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
