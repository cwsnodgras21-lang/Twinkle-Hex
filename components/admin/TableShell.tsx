import { ReactNode } from "react";

interface TableShellProps {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
  emptyContent?: ReactNode;
}

/**
 * Reusable table wrapper for admin list views.
 * Future: Sortable headers, column visibility, pagination.
 */
export function TableShell({ headers, children, empty, emptyContent }: TableShellProps) {
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="min-w-full divide-y divide-ink/10">
        <thead className="bg-ink/5">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-ink/70 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-ink/5">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12">
                {emptyContent ?? (
                  <p className="text-center text-ink/60">No records found.</p>
                )}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
