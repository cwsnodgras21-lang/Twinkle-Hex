import { ReactNode } from "react";
import { AdminTopbar } from "./AdminTopbar";

interface AdminPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Standard admin page wrapper - topbar, header, content area.
 */
export function AdminPageShell({ title, description, children, actions }: AdminPageShellProps) {
  return (
    <>
      <AdminTopbar />
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-ink/70">{description}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </>
  );
}
