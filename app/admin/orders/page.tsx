import Link from "next/link";
import { AdminPageShell, TableShell, EmptyState, StatusBadge } from "@/components/admin";
import { listCommerceOrders } from "@/lib/commerce/orders";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof listCommerceOrders>> = [];
  let loadError: string | null = null;
  try {
    orders = await listCommerceOrders();
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : "Could not load orders (apply migration 015 if missing).";
  }

  const needsMappingCount = orders.filter((o) => o.mapping_status === "needs_mapping").length;

  return (
    <AdminPageShell
      title="Orders"
      description="Shopify demand received via webhook. Map variants to polishes — no inventory or production automation yet."
    >
      {loadError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {!loadError && orders.length > 0 && (
        <p className="mb-4 text-sm text-ink/70">
          {orders.length} order{orders.length === 1 ? "" : "s"}
          {needsMappingCount > 0 ? (
            <>
              {" "}
              · <span className="text-magenta font-medium">{needsMappingCount} need mapping</span>
            </>
          ) : (
            <> · all lines mapped</>
          )}
        </p>
      )}

      <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
        <TableShell
          headers={[
            "Order",
            "Date",
            "Customer",
            "Bottles",
            "Payment",
            "Fulfillment",
            "Mapping",
            "Total",
          ]}
          empty={orders.length === 0 && !loadError}
          emptyContent={
            <EmptyState
              title="No Shopify orders yet"
              description="When Shopify sends order webhooks, they will show up here."
            />
          }
        >
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-ink/[0.02] transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium text-teal hover:underline"
                >
                  {order.shopify_order_name ??
                    (order.shopify_order_number != null
                      ? `#${order.shopify_order_number}`
                      : order.shopify_order_id)}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/70 text-sm">{formatDate(order.ordered_at)}</td>
              <td className="px-4 py-3 text-ink">
                <div className="font-medium">{order.customer_name ?? "—"}</div>
                {order.customer_email && (
                  <div className="text-xs text-ink/50">{order.customer_email}</div>
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-ink/80">{order.bottle_count}</td>
              <td className="px-4 py-3 text-sm text-ink/70 capitalize">
                {order.financial_status ?? "—"}
              </td>
              <td className="px-4 py-3 text-sm text-ink/70 capitalize">
                {order.fulfillment_status ?? "unfulfilled"}
              </td>
              <td className="px-4 py-3">
                {order.mapping_status === "needs_mapping" ? (
                  <StatusBadge
                    label={`Needs mapping (${order.unmapped_line_count})`}
                    variant="warning"
                  />
                ) : (
                  <StatusBadge label="Fully mapped" variant="success" />
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-ink font-medium">
                {formatMoney(order.total, order.currency)}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </AdminPageShell>
  );
}
