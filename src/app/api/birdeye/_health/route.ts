import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/birdeye/_health
 *
 * Diagnostic-only endpoint. Reports the configured state of the Birdeye
 * integration without leaking the API key, and pings a cheap upstream
 * endpoint so we can tell at a glance whether the key is valid and
 * whether the plan allows the endpoints we use.
 *
 * Response shape:
 * {
 *   configured: boolean,            // is BIRDEYE_API_KEY set on the server?
 *   keyPreview: string | null,      // first 4 + last 4 chars, or null
 *   upstream: {
 *     endpoint: string,             // the URL we tested
 *     status: number,               // HTTP status from Birdeye
 *     ok: boolean,
 *     bodyPreview: string,          // first 300 chars of upstream response
 *   } | null
 * }
 */
export async function GET() {
  const apiKey = process.env.BIRDEYE_API_KEY;
  const configured = Boolean(apiKey);
  const keyPreview = apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : null;

  if (!configured) {
    return NextResponse.json({
      configured: false,
      keyPreview: null,
      upstream: null,
      hint: 'BIRDEYE_API_KEY is not set on the server. Add it in Vercel env (Production + Preview + Development).',
    });
  }

  // Cheapest upstream call we can make — /defi/token_trending with limit=1.
  // If this 403s, the key is bad or the endpoint is gated by plan.
  const endpoint = 'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=1';
  try {
    const res = await fetch(endpoint, {
      headers: {
        'X-API-KEY': apiKey!,
        'x-chain': 'solana',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.text();
    return NextResponse.json({
      configured: true,
      keyPreview,
      upstream: {
        endpoint,
        status: res.status,
        ok: res.ok,
        bodyPreview: body.slice(0, 300),
      },
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      keyPreview,
      upstream: {
        endpoint,
        status: 0,
        ok: false,
        bodyPreview: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
