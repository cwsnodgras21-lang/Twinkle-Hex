import Link from "next/link";
import { Suspense } from "react";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { ReleaseKanban } from "@/components/admin/releases";
import { listReleases } from "@/lib/admin/releases";
import { ReleaseListFilters } from "./ReleaseListFilters";
import type { ReleaseStatus } from "@/types/admin";
import { RELEASE_STATUSES } from "@/types/admin";

interface Props {
  searchParams: Promise<{ status?: string; view?: string }>;
}

export default async function AdminReleasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter: ReleaseStatus | undefined =
    params.status && params.status !== "all" && (RELEASE_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as ReleaseStatus)
      : undefined;
  const view = params.view === "table" ? "table" : "pipeline";

  const releases = await listReleases(statusFilter);

  return (
    <AdminPageShell
      title="Releases"
      description="Launch pipeline for new shades."
      actions={
        <Link
          href="/admin/releases/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New Release
        </Link>
      }
    >
      <Suspense fallback={<div className="h-14 border-b border-ink/10" />}>
        <ReleaseListFilters currentStatus={statusFilter} currentView={view} />
      </Suspense>

      {releases.length === 0 ? (
        <div className="bg-white border border-ink/10 rounded-lg overflow-hidden mt-4">
          <EmptyState
            title="No releases yet"
            description="Plan your next polish launch."
            action={
              <Link
                href="/admin/releases/new"
                className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
              >
                New Release
              </Link>
            }
          />
        </div>
      ) : view === "pipeline" ? (
        <div className="mt-4">
          <ReleaseKanban releases={releases} statusFilter={statusFilter} />
        </div>
      ) : (
        <div className="bg-white border border-ink/10 rounded-lg overflow-hidden mt-4">
          <TableShell
            headers={["Name", "Status", "Launch Date", "Collection", "Items"]}
            empty={false}
          >
            {releases.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/releases/${r.id}`} className="text-teal hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={r.status.replace(/_/g, " ")}
                    variant={
                      r.status === "live"
                        ? "success"
                        : r.status === "launch_ready"
                          ? "info"
                          : "neutral"
                    }
                  />
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {r.target_launch_date
                    ? new Date(r.target_launch_date).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">{r.collection ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">—</td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}
    </AdminPageShell>
  );
}
