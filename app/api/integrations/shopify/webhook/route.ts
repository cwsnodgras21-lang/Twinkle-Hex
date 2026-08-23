import { NextResponse } from "next/server";

import { ingestShopifyOrder } from "@/lib/commerce/ingest";
import { createSupabaseCommerceRepository } from "@/lib/commerce/repository";
import {
  authorizeShopifyWebhook,
  getShopifyHeader,
} from "@/lib/commerce/shopify-auth";
import {
  isSupportedOrderTopic,
  normalizeShopifyOrderWebhook,
} from "@/lib/commerce/shopify-normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/shopify/webhook
 *
 * Shopify → this endpoint → commerce ingest → Supabase.
 * Verifies X-Shopify-Hmac-Sha256 against the raw body using SHOPIFY_CLIENT_SECRET
 * before any database work.
 */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const hmacHeader = getShopifyHeader(request.headers, "x-shopify-hmac-sha256");
  const shopDomainHeader = getShopifyHeader(
    request.headers,
    "x-shopify-shop-domain"
  );

  const auth = authorizeShopifyWebhook({
    rawBody,
    hmacHeader,
    shopDomainHeader,
  });
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const topic = getShopifyHeader(request.headers, "x-shopify-topic") ?? "";
  const webhookId =
    getShopifyHeader(request.headers, "x-shopify-webhook-id") ?? "";
  const triggeredAt = getShopifyHeader(
    request.headers,
    "x-shopify-triggered-at"
  );

  const repo = createSupabaseCommerceRepository();

  if (!isSupportedOrderTopic(topic)) {
    if (webhookId) {
      try {
        const existing = await repo.findEventByProviderEventId("shopify", webhookId);
        if (!existing) {
          const ev = await repo.insertEvent({
            provider: "shopify",
            event_id: webhookId,
            event_type: topic || "unknown",
            shop_domain: auth.shopDomain,
            status: "processed",
            received_at: triggeredAt ?? new Date().toISOString(),
          });
          await repo.updateEvent(ev.id, {
            status: "processed",
            processed_at: new Date().toISOString(),
            error_message: `Ignored unsupported topic: ${topic || "(missing)"}`.slice(
              0,
              500
            ),
          });
        }
      } catch (err) {
        console.error(
          "[shopify-webhook] unsupported topic audit failed",
          err instanceof Error ? err.message : err
        );
      }
    }

    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "unsupported_topic",
      topic: topic || null,
    });
  }

  if (!webhookId) {
    return NextResponse.json(
      { ok: false, error: "Missing X-Shopify-Webhook-Id" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const normalized = normalizeShopifyOrderWebhook({
    topic,
    shopDomain: auth.shopDomain,
    webhookId,
    receivedAt: triggeredAt ?? new Date().toISOString(),
    body,
  });
  if (!normalized.ok) {
    return NextResponse.json(
      { ok: false, error: normalized.error },
      { status: 400 }
    );
  }

  try {
    const result = await ingestShopifyOrder(normalized.data, repo);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        created: result.created,
        skippedStale: result.skippedStale,
        orderId: result.orderId,
        shopifyOrderId: result.shopifyOrderId,
        lineCount: result.lineCount,
        mappedLineCount: result.mappedLineCount,
        unmappedLineCount: result.unmappedLineCount,
      },
      { status: result.status }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[shopify-webhook]", message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
