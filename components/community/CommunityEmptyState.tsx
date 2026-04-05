import { ReactNode } from "react";

interface CommunityEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Empty state for community views.
 * Follows same pattern as admin EmptyState.
 */
export function CommunityEmptyState({ title, description, action }: CommunityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-ink/60 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
