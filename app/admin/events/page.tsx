import Link from "next/link";
import { AdminPageShell, TableShell, StatusBadge, EmptyState } from "@/components/admin";
import { listEvents } from "@/lib/admin/events";

export default async function AdminEventsPage() {
  const events = await listEvents();

  return (
    <AdminPageShell
      title="Events & Expos"
      description="Track expos, markets, and events."
      actions={
        <Link
          href="/admin/events/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          Add Event
        </Link>
      }
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Name", "Date", "Location", "Status"]}
          empty={events.length === 0}
          emptyContent={
            <EmptyState
              title="No events yet"
              description="Add expos and events to your calendar."
              action={
                <Link
                  href="/admin/events/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Add Event
                </Link>
              }
            />
          }
        >
          {events.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/events/${e.id}`} className="text-teal hover:underline">
                  {e.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">
                {new Date(e.start_date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-ink/70">{e.location ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={e.status ?? "planned"}
                  variant={
                    e.status === "completed"
                      ? "success"
                      : e.status === "confirmed"
                        ? "info"
                        : "neutral"
                  }
                />
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
