/**
 * Server-only bearer auth for n8n → app ingest endpoints.
 * Never expose TWINKLE_N8N_INGEST_SECRET to the browser.
 */

export const N8N_INGEST_SECRET_ENV = "TWINKLE_N8N_INGEST_SECRET";

export type IngestAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length ? token : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function authorizeN8nIngest(
  authorizationHeader: string | null,
  env: NodeJS.ProcessEnv = process.env
): IngestAuthResult {
  const expected = env[N8N_INGEST_SECRET_ENV]?.trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "Ingest endpoint is not configured",
    };
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token || !timingSafeEqual(token, expected)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
