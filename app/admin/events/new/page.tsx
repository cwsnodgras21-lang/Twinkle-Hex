import Link from "next/link";
import { AdminPageShell, FormShell } from "@/components/admin";

export default function NewEventPage() {
  return (
    <AdminPageShell
      title="Add Event"
      description="Add an expo or event."
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
              Cancel
            </Link>
          </>
        }
      >
        <form id="event-form" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
              placeholder="e.g. Indie Expo 2024"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-1">
                Start date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-ink mb-1">
                End date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className="w-full border border-ink/20 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-ink mb-1">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2"
            />
          </div>
        </form>
      </FormShell>
    </AdminPageShell>
  );
}
