import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * Empty state for lists and detail views.
 * Use when no data exists or filters return nothing.
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-ink/30">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-ink/60 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}
