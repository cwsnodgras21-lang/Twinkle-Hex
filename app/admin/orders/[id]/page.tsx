import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell, StatusBadge } from "@/components/admin";
import { MapVariantForm } from "@/components/admin/orders/MapVariantForm";
import { PolishSwatch } from "@/components/admin/polishes";
import { getCommerceOrderDetail } from "@/lib/commerce/orders";
import { listPolishes } from "@/lib/admin/polishes";

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

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let order: Awaited<ReturnType<typeof getCommerceOrderDetail>> = null;
  let polishes: Awaited<ReturnType<typeof listPolishes>> = [];
  try {
    order = await getCommerceOrderDetail(params.id);
    polishes = await listPolishes();
  } catch {
    order = null;
  }
  if (!order) notFound();

  const polishOptions = polishes.map((p) => ({ id: p.id, name: p.name }));
  const title =
    order.shopify_order_name ??
    (order.shopify_order_number != null
      ? `#${order.shopify_order_number}`
      : order.shopify_order_id);

  return (
    <AdminPageShell
      title={title}
      description={`Shopify order ${order.shopify_order_id} · ${formatDateTime(order.ordered_at)}`}
      actions={
        <Link
          href="/admin/orders"
          className="inline-flex px-4 py-2 border border-ink/15 rounded-lg text-sm font-medium text-ink hover:bg-ink/5"
        >
          All orders
        </Link>
      }
    >
      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-ink/10 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-ink/50">Customer</div>
          <div className="mt-1 font-medium text-ink">{order.customer_name ?? "—"}</div>
          <div className="text-sm text-ink/60">{order.customer_email ?? ""}</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-ink/50">Payment</div>
          <div className="mt-1 font-medium text-ink capitalize">
            {order.financial_status ?? "—"}
          </div>
        </div>
        <div className="bg-white border border-ink/10 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-ink/50">Fulfillment</div>
          <div className="mt-1 font-medium text-ink capitalize">
            {order.fulfillment_status ?? "unfulfilled"}
          </div>
        </div>
        <div className="bg-white border border-ink/10 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-ink/50">Total</div>
          <div className="mt-1 font-medium text-ink">
            {formatMoney(order.total, order.currency)}
          </div>
          <div className="text-sm text-ink/60">{order.bottle_count} bottles</div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-ink">Line items</h2>
        {order.mapping_status === "needs_mapping" ? (
          <StatusBadge label="Needs mapping" variant="warning" />
        ) : (
          <StatusBadge label="Fully mapped" variant="success" />
        )}
      </div>

      <div className="bg-white border border-ink/10 rounded-xl divide-y divide-ink/5 shadow-sm">
        {order.lines.map((line) => (
          <div key={line.id} className="p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium text-ink">
                  {line.product_title ?? "Untitled product"}
                </div>
                <div className="text-sm text-ink/60">
                  {line.variant_title && line.variant_title !== "Default Title"
                    ? line.variant_title
                    : "Default variant"}
                  {line.sku ? ` · SKU ${line.sku}` : ""}
                </div>
                <div className="mt-1 text-xs text-ink/40 font-mono">
                  variant {line.shopify_variant_id ?? "—"} · qty {line.quantity} ·{" "}
                  {formatMoney(line.unit_price, order.currency)} each
                </div>
              </div>
              <div className="text-right">
                {line.polish_id ? (
                  <Link
                    href={`/admin/polishes/${line.polish_id}`}
                    className="inline-flex items-center gap-2 text-teal hover:underline"
                  >
                    <PolishSwatch colorHex={line.polish_color_hex ?? undefined} size="sm" />
                    {line.polish_name ?? "Mapped polish"}
                  </Link>
                ) : (
                  <StatusBadge label="Unmapped" variant="warning" />
                )}
              </div>
            </div>

            {!line.polish_id && line.shopify_variant_id && (
              <MapVariantForm
                shopDomain={order.shop_domain}
                shopifyVariantId={line.shopify_variant_id}
                shopifyProductId={line.shopify_product_id}
                sku={line.sku}
                polishes={polishOptions}
              />
            )}
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
