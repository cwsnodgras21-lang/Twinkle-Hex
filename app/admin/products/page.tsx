import { AdminPageShell, TableShell, FiltersBar, EmptyState } from "@/components/admin";

export default function AdminProductsPage() {
  // Placeholder - where Shopify product data plugs in via shopifyAdmin.fetchProducts()
  const products: unknown[] = [];

  return (
    <AdminPageShell
      title="Products"
      description="Product catalog from Shopify."
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
          headers={["Product", "Handle", "Status", "Variants"]}
          empty={products.length === 0}
          emptyContent={
            <EmptyState
              title="Products sync from Shopify"
              description="Connect Shopify Admin API to display products here."
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
