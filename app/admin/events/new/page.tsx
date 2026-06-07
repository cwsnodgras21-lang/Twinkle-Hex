import Link from "next/link";
import { AdminPageShell, EventForm, FormShell } from "@/components/admin";

export default function NewEventPage() {
  return (
    <AdminPageShell
      title="Add Event"
      description="Add an expo or event."
    >
      <FormShell
        title="Event details"
        actions={
          <Link
            href="/admin/events"
            className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5"
          >
            Cancel
          </Link>
        }
      >
        <EventForm mode="create" />
      </FormShell>
    </AdminPageShell>
  );
}
