import Link from "next/link";
import { AdminPageShell, TableShell, FiltersBar, EmptyState } from "@/components/admin";

export default function AdminOrdersPage() {
  // Placeholder - where Shopify order data plugs in via shopifyAdmin.fetchOrders()
  const orders: unknown[] = [];

  return (
    <AdminPageShell
      title="Orders"
      description="View and manage orders from Shopify."
      actions={
        <a
          href="https://admin.shopify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal hover:underline"
        >
          Open Shopify Admin →
        </a>
      }
    >
      <FiltersBar />
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <TableShell
          headers={["Order", "Customer", "Total", "Status", "Date"]}
          empty={orders.length === 0}
          emptyContent={
            <EmptyState
              title="Orders sync from Shopify"
              description="Connect Shopify Admin API to display orders here. Until then, use the Shopify dashboard."
              action={
                <a
                  href="https://admin.shopify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90"
                >
                  Open Shopify
                </a>
              }
            />
          }
        >
          <tr>
            <td colSpan={5}>...</td>
          </tr>
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
