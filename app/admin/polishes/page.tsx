import Link from "next/link";
import { AdminPageShell, EmptyState } from "@/components/admin";
import { PolishSwatch } from "@/components/admin/polishes";
import { listPolishesWithLineCount } from "@/lib/admin/polishes";

export default async function AdminPolishesPage() {
  const polishes = await listPolishesWithLineCount();

  return (
    <AdminPageShell
      title="Polishes"
      description="Every shade and how it's made. Open a polish to view or edit its recipe."
      actions={
        <Link
          href="/admin/polishes/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium transition-colors"
        >
          New polish
        </Link>
      }
    >
      {polishes.length === 0 ? (
        <div className="bg-white border border-ink/10 rounded-xl">
          <EmptyState
            title="No polishes yet"
            description="Create a polish, then add its recipe (ingredients + amounts) on the same page."
            action={
              <Link
                href="/admin/polishes/new"
                className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
              >
                New polish
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {polishes.map((p) => (
            <Link
              key={p.id}
              href={`/admin/polishes/${p.id}`}
              className="group bg-white border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-plum/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <PolishSwatch colorHex={p.color_hex} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate group-hover:text-plum transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-ink/60 mt-0.5">
                    {p.line_count > 0
                      ? `${p.line_count} ingredient${p.line_count === 1 ? "" : "s"}`
                      : "No recipe yet"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
