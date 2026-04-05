import { ReactNode } from "react";

interface FormShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Form wrapper for create/edit pages.
 * Future: Form validation, dirty state, cancel confirmation.
 */
export function FormShell({ title, description, children, actions }: FormShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink/60">{description}</p>
        )}
      </div>
      <div className="bg-white border border-ink/10 rounded-lg p-4 md:p-6">
        {children}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-3">{actions}</div>
      )}
    </div>
  );
}
