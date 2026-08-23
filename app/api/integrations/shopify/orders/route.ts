import { NextResponse } from "next/server";
import { authorizeN8nIngest } from "@/lib/commerce/auth";
import { ingestShopifyOrder } from "@/lib/commerce/ingest";
import { createSupabaseCommerceRepository } from "@/lib/commerce/repository";

export const runtime = "nodejs";

/**
 * POST /api/integrations/shopify/orders
 * Called by n8n (not Shopify). Auth: Authorization: Bearer <TWINKLE_N8N_INGEST_SECRET>
 */
export async function POST(request: Request) {
  const auth = authorizeN8nIngest(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const repo = createSupabaseCommerceRepository();
    const result = await ingestShopifyOrder(body, repo);
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
    // Never log secrets; message may include DB details only.
    console.error("[shopify-ingest]", message);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
