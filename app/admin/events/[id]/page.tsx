import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, FormShell } from "@/components/admin";
import { getEventById } from "@/lib/admin/events";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <AdminPageShell
      title={`Edit: ${event.name}`}
      description="Update event details."
    >
      <FormShell
        title="Event details"
        actions={
          <>
            <button
              type="submit"
              form="event-form"
              className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
            >
              Save
            </button>
            <Link
              href="/admin/events"
              className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
            >
              Back
            </Link>
          </>
        }
      >
        <form id="event-form" className="space-y-4">
          <input type="hidden" name="id" value={event.id} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={event.name}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={event.status ?? "planned"}
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            >
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
