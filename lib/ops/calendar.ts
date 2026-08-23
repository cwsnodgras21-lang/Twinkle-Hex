/**
 * Calendar projection — one timeline from releases, R&D, batches, swatchers,
 * and optional marketing notes. Not a second task system.
 */

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind:
    | "launch"
    | "production"
    | "swatcher_send"
    | "swatch_return"
    | "marketing"
    | "rd_review"
    | "batch"
    | "note";
  href?: string;
  detail?: string;
};

export function buildOpsCalendar(input: {
  from: string;
  to: string;
  releases: Array<{
    id: string;
    name: string;
    target_launch_date: string | null;
    production_complete_by: string | null;
    swatcher_send_by: string | null;
    swatch_return_by: string | null;
    marketing_ready_by: string | null;
  }>;
  rdReviews: Array<{ id: string; name: string; review_date: string | null; status: string }>;
  batches: Array<{ id: string; polish_name: string; planned_date: string | null; status: string }>;
  notes: Array<{ id: string; title: string; item_date: string; kind: string; release_id?: string | null }>;
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const inRange = (d: string | null | undefined) => !!d && d >= input.from && d <= input.to;

  for (const r of input.releases) {
    if (inRange(r.production_complete_by)) {
      events.push({
        id: `prod-${r.id}`,
        date: r.production_complete_by!,
        title: `Production complete: ${r.name}`,
        kind: "production",
        href: `/admin/releases/${r.id}`,
      });
    }
    if (inRange(r.swatcher_send_by)) {
      events.push({
        id: `send-${r.id}`,
        date: r.swatcher_send_by!,
        title: `Swatcher send: ${r.name}`,
        kind: "swatcher_send",
        href: `/admin/swatchers?release=${r.id}`,
      });
    }
    if (inRange(r.swatch_return_by)) {
      events.push({
        id: `ret-${r.id}`,
        date: r.swatch_return_by!,
        title: `Swatches due back: ${r.name}`,
        kind: "swatch_return",
        href: `/admin/releases/${r.id}`,
      });
    }
    if (inRange(r.marketing_ready_by)) {
      events.push({
        id: `mkt-${r.id}`,
        date: r.marketing_ready_by!,
        title: `Marketing ready: ${r.name}`,
        kind: "marketing",
        href: `/admin/releases/${r.id}`,
      });
    }
    if (inRange(r.target_launch_date)) {
      events.push({
        id: `launch-${r.id}`,
        date: r.target_launch_date!,
        title: `Launch: ${r.name}`,
        kind: "launch",
        href: `/admin/releases/${r.id}`,
      });
    }
  }

  for (const rd of input.rdReviews) {
    if (rd.status === "in_progress" && inRange(rd.review_date)) {
      events.push({
        id: `rd-${rd.id}`,
        date: rd.review_date!,
        title: `R&D review: ${rd.name}`,
        kind: "rd_review",
        href: `/admin/rd/${rd.id}`,
      });
    }
  }

  for (const b of input.batches) {
    if (b.status !== "cancelled" && inRange(b.planned_date)) {
      events.push({
        id: `batch-${b.id}`,
        date: b.planned_date!,
        title: `Batch: ${b.polish_name}`,
        kind: "batch",
        href: `/admin/polishes`,
      });
    }
  }

  for (const n of input.notes) {
    if (inRange(n.item_date)) {
      events.push({
        id: `note-${n.id}`,
        date: n.item_date,
        title: n.title,
        kind: "note",
        href: n.release_id ? `/admin/releases/${n.release_id}` : undefined,
        detail: n.kind,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
