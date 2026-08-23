import Link from "next/link";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { listRdPrototypes } from "@/lib/admin/rd";
import { isRdReviewDue } from "@/lib/ops/release-risk";
import { todayDateString } from "@/lib/admin/supabase-write";

export default async function RdLabPage() {
  let items: Awaited<ReturnType<typeof listRdPrototypes>> = [];
  try {
    items = await listRdPrototypes();
  } catch {
    items = [];
  }
  const today = todayDateString();

  return (
    <AdminPageShell
      title="R&D Lab"
      description="Prototypes and observation windows — separate from production until explicitly approved."
      actions={
        <Link
          href="/admin/rd/new"
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          New prototype
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-ink/60 border border-ink/10 rounded-xl bg-white px-4 py-8 text-center">
          No prototypes yet. Receive an experimental pigment, attach SDS on the ingredient, then start
          a prototype with a review date.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => {
            const due = p.status === "in_progress" && isRdReviewDue(p.review_date, today);
            return (
              <li key={p.id} className="bg-white border border-ink/10 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <Link href={`/admin/rd/${p.id}`} className="font-semibold text-ink hover:text-plum">
                      {p.name}
                    </Link>
                    <p className="text-sm text-ink/60 mt-1">
                      {p.ingredient_name ? `Pigment: ${p.ingredient_name}` : "No linked ingredient"}
                      {p.ingredient_lifecycle ? ` · ${p.ingredient_lifecycle}` : ""}
                      {p.review_date ? ` · Review ${p.review_date}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge
                      label={p.status.replace("_", " ")}
                      variant={
                        p.status === "approved" ? "success" : p.status === "rejected" ? "warning" : "info"
                      }
                    />
                    {due ? <StatusBadge label="Review due" variant="warning" /> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPageShell>
  );
}
