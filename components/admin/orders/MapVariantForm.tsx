"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mapShopifyVariantToPolishAction } from "@/app/admin/orders/actions";

type PolishOption = { id: string; name: string };

type Props = {
  shopDomain: string;
  shopifyVariantId: string;
  shopifyProductId: string | null;
  sku: string | null;
  polishes: PolishOption[];
};

/** Map an unmapped Shopify variant to an existing polish; backfills open lines. */
export function MapVariantForm({
  shopDomain,
  shopifyVariantId,
  shopifyProductId,
  sku,
  polishes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await mapShopifyVariantToPolishAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage(
            result.linesUpdated > 0
              ? `Mapped. Updated ${result.linesUpdated} existing line${result.linesUpdated === 1 ? "" : "s"}.`
              : "Mapped."
          );
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="shop_domain" value={shopDomain} />
      <input type="hidden" name="shopify_variant_id" value={shopifyVariantId} />
      <input type="hidden" name="shopify_product_id" value={shopifyProductId ?? ""} />
      <input type="hidden" name="sku" value={sku ?? ""} />
      <select
        name="polish_id"
        required
        defaultValue=""
        className="flex-1 min-w-[12rem] rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
        disabled={pending}
      >
        <option value="" disabled>
          Select polish…
        </option>
        {polishes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex px-3 py-2 bg-teal text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save mapping"}
      </button>
      {error && <p className="text-sm text-red-700 sm:basis-full">{error}</p>}
      {message && <p className="text-sm text-teal sm:basis-full">{message}</p>}
    </form>
  );
}
