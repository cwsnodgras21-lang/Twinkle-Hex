import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState, StatusBadge } from "@/components/admin";
import { PolishSwatch } from "@/components/admin/polishes";
import { listFinishedInventoryItemsWithPolish } from "@/lib/admin/inventory";

export default async function AdminInventoryPage() {
  let items: Awaited<ReturnType<typeof listFinishedInventoryItemsWithPolish>> = [];
  let loadError: string | null = null;
  try {
    items = await listFinishedInventoryItemsWithPolish();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load stock (check Supabase table).";
  }

  return (
    <AdminPageShell
      title="Finished Stock"
      description="What we actually have bottled and ready to sell — with a link back to the recipe it's made from."
      actions={
        <Link
          href="/admin/inventory/new"
          className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 text-sm font-medium transition-colors"
        >
          New stock item
        </Link>
      }
    >
      {loadError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          {loadError}
        </div>
      )}
      <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
        <TableShell
          headers={["Name", "Recipe", "SKU", "On hand", "Reserved", "Available", "Location"]}
          empty={items.length === 0 && !loadError}
          emptyContent={
            <EmptyState
              title="No stock items yet"
              description="Add finished polish stock to start tracking what's ready to sell."
              action={
                <Link
                  href="/admin/inventory/new"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  New stock item
                </Link>
              }
            />
          }
        >
          {items.map((row) => {
            const available = row.quantity_on_hand - row.reserved_quantity;
            const isLow = available <= 0;
            return (
              <tr key={row.id} className="hover:bg-ink/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3">
                  {row.polish_id ? (
                    <Link
                      href={`/admin/polishes/${row.polish_id}`}
                      className="inline-flex items-center gap-2 text-teal hover:underline"
                    >
                      <PolishSwatch colorHex={row.polish_color_hex} size="sm" />
                      {row.polish_name}
                    </Link>
                  ) : (
                    <span className="text-ink/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink/70 font-mono text-sm">{row.sku ?? "—"}</td>
                <td className="px-4 py-3 text-ink/80 tabular-nums">{row.quantity_on_hand}</td>
                <td className="px-4 py-3 text-ink/70 tabular-nums">{row.reserved_quantity}</td>
                <td className="px-4 py-3">
                  {isLow ? (
                    <StatusBadge label={`${available} left`} variant="warning" />
                  ) : (
                    <span className="tabular-nums text-ink/80">{available}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink/70">{row.location ?? "—"}</td>
              </tr>
            );
          })}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
