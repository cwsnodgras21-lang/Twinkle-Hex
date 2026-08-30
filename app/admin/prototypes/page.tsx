import Link from "next/link";
import { AdminPageShell, EmptyState, StatusBadge } from "@/components/admin";
import { listPolishPrototypes } from "@/lib/admin/prototypes";
import type { PolishPrototypeStatus } from "@/types/admin";

const STATUS_VARIANT: Record<PolishPrototypeStatus, "info" | "success" | "warning" | "neutral"> = {
  testing: "info",
  selected: "success",
  rejected: "warning",
  archived: "neutral",
};

export default async function PrototypesPage() {
  let items: Awaited<ReturnType<typeof listPolishPrototypes>> = [];
  try {
    items = await listPolishPrototypes();
  } catch {
    items = [];
  }

  return (
    <AdminPageShell
      title="Polish Prototypes"
      description="15 mL development formulas — separate from ingredient R&D until you promote one to a production polish."
      actions={
        <Link
          href="/admin/prototypes/new"
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New prototype
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="bg-white border border-ink/10 rounded-xl">
          <EmptyState
            title="No prototypes yet"
            description="Start a 15 mL development formula, log the formula lines and observations, then promote the winner to production."
            action={
              <Link
                href="/admin/prototypes/new"
                className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
              >
                New prototype
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <Link href={`/admin/prototypes/${p.id}`} className="font-semibold text-ink hover:text-plum">
                    {p.name}
                  </Link>
                  <p className="text-sm text-ink/60 mt-1">
                    {p.target_size_ml} mL · Created {p.created_date}
                    {p.promoted_polish_id ? " · Promoted to production" : ""}
                  </p>
                </div>
                <StatusBadge label={p.status} variant={STATUS_VARIANT[p.status] ?? "neutral"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPageShell>
  );
}
