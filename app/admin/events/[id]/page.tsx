import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, EventForm, FormShell } from "@/components/admin";
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
          <Link
            href="/admin/events"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Back
          </Link>
        }
      >
        <EventForm event={event} mode="edit" />
      </FormShell>
    </AdminPageShell>
  );
}
