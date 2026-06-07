"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEventAction, updateEventAction } from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { Event } from "@/types/admin";

const STATUS_OPTIONS: NonNullable<Event["status"]>[] = [
  "planned",
  "confirmed",
  "completed",
  "cancelled",
];

interface EventFormProps {
  event?: Event | null;
  mode: "create" | "edit";
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (mode === "create") {
        const result = await createEventAction(formData);
        if (result.ok) {
          router.push(`/admin/events/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (event) {
        const result = await updateEventAction(event.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="event-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={event?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="e.g. Indie Expo 2024"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-ink mb-1">
            Event type
          </label>
          <input
            id="event_type"
            name="event_type"
            type="text"
            defaultValue={event?.event_type}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
            placeholder="Expo, market, pop-up, convention"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={event?.status ?? "planned"}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-1">
            Start date *
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={event?.start_date ?? ""}
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
            defaultValue={event?.end_date ?? ""}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-ink mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={event?.location}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="booth" className="block text-sm font-medium text-ink mb-1">
            Booth
          </label>
          <input
            id="booth"
            name="booth"
            type="text"
            defaultValue={event?.booth}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={event?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Travel, setup, staffing, or promotion notes"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
