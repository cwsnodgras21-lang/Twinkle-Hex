import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState } from "@/components/admin";
import { listAllPolishesWithRelease } from "@/lib/admin/polishes";

export default async function AdminPolishesPage() {
  const polishes = await listAllPolishesWithRelease();

  return (
    <AdminPageShell
      title="Polishes"
      description="Shades linked to releases. Open a polish to view or edit its recipe (ingredients in ounces). You can also add polishes from each release’s page."
    >
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Polish", "Release", "Collection", "Recipe"]}
          empty={polishes.length === 0}
          emptyContent={
            <EmptyState
              title="No polishes yet"
              description="Go to a release, use “Add polish”, then manage the recipe on the polish page. Or run your database migrations if tables are new."
              action={
                <Link
                  href="/admin/releases"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Open releases
                </Link>
              }
            />
          }
        >
          {polishes.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/releases/${p.release_id}/polishes/${p.id}`}
                  className="font-medium text-teal hover:underline"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/80">
                <Link
                  href={`/admin/releases/${p.release_id}`}
                  className="text-teal hover:underline"
                >
                  {p.release_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70">{p.release_collection ?? "—"}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/releases/${p.release_id}/polishes/${p.id}`}
                  className="text-sm text-teal hover:underline"
                >
                  View / edit →
                </Link>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
