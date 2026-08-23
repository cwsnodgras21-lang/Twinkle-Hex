import { AdminPageShell } from "@/components/admin";
import { loadOpsCalendar } from "@/lib/admin/command-center-data";
import { listReleases } from "@/lib/admin/releases";
import { CalendarNoteForm } from "@/components/admin/calendar/CalendarNoteForm";

const KIND_LABEL: Record<string, string> = {
  launch: "Launch",
  production: "Production",
  swatcher_send: "Swatcher send",
  swatch_return: "Swatch return",
  marketing: "Marketing",
  rd_review: "R&D",
  batch: "Batch",
  note: "Note",
};

export default async function CalendarPage() {
  const [events, releases] = await Promise.all([
    loadOpsCalendar(90),
    listReleases().catch(() => []),
  ]);

  const byDate = new Map<string, typeof events>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  const dates = Array.from(byDate.keys()).sort();

  return (
    <AdminPageShell
      title="Operating calendar"
      description="One timeline for R&D, production, swatching, marketing, and launch — next ~90 days."
    >
      <div className="mb-8 bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-ink mb-3">Add marketing note</h2>
        <CalendarNoteForm
          releases={releases.map((r) => ({ id: r.id, name: r.name }))}
        />
      </div>

      {dates.length === 0 ? (
        <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-8 text-center">
          No dated milestones yet. Plan a release or R&D review to populate this calendar.
        </p>
      ) : (
        <ol className="space-y-6">
          {dates.map((date) => (
            <li key={date}>
              <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wide mb-2">
                {date}
              </h2>
              <ul className="space-y-2">
                {(byDate.get(date) ?? []).map((e) => (
                  <li
                    key={e.id}
                    className="bg-white border border-ink/10 rounded-lg px-4 py-3 flex flex-wrap justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-ink">{e.title}</p>
                      <p className="text-xs text-ink/50 mt-0.5">{KIND_LABEL[e.kind] ?? e.kind}</p>
                    </div>
                    {e.href ? (
                      <a href={e.href} className="text-sm text-teal hover:underline">
                        Open →
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </AdminPageShell>
  );
}
