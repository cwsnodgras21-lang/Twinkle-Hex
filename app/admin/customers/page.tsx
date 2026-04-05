import { AdminPageShell, TableShell, FiltersBar, EmptyState } from "@/components/admin";

export default function AdminCustomersPage() {
  // Placeholder - where Shopify customer data plugs in via shopifyAdmin.fetchCustomers()
  const customers: unknown[] = [];

  return (
    <AdminPageShell
      title="Customers"
      description="Customer data from Shopify."
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
          headers={["Name", "Email", "Orders", "Created"]}
          empty={customers.length === 0}
          emptyContent={
            <EmptyState
              title="Customers sync from Shopify"
              description="Connect Shopify Admin API to display customers here."
            />
          }
        >
          <tr>
            <td colSpan={4}>...</td>
          </tr>
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
