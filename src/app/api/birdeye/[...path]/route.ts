import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BIRDEYE_BASE = 'https://public-api.birdeye.so';

// Allow-list of forwarded Birdeye paths. Anything not on this list → 404.
// Prevents the proxy from being used as an open relay.
const ALLOWED_PATHS = new Set<string>([
  'defi/token_security',
  'defi/token_trending',
  'defi/tokenlist',
  'defi/history_price',
  'v2/tokens/new_listing',
]);

// Per-endpoint cache TTL (ms). Trending/new listings/tokenlist change slowly;
// security is effectively static; history_price is slightly more volatile.
const CACHE_TTL_MS: Record<string, number> = {
  'defi/token_security': 10 * 60_000,
  'defi/token_trending': 60_000,
  'defi/tokenlist': 60_000,
  'defi/history_price': 60_000,
  'v2/tokens/new_listing': 60_000,
};

type CacheEntry = { expiresAt: number; status: number; body: string };
const responseCache = new Map<string, CacheEntry>();

function cacheKey(path: string, query: string): string {
  return `${path}?${query}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const joinedPath = path.join('/');

  if (!ALLOWED_PATHS.has(joinedPath)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 404 });
  }

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'BIRDEYE_API_KEY is not configured on the server.' },
      { status: 503 }
    );
  }

  const query = request.nextUrl.searchParams.toString();
  const key = cacheKey(joinedPath, query);
  const now = Date.now();

  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return new NextResponse(cached.body, {
      status: cached.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
        'X-Birdeye-Cache': 'HIT',
      },
    });
  }

  const upstreamUrl = `${BIRDEYE_BASE}/${joinedPath}${query ? `?${query}` : ''}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'X-API-KEY': apiKey,
        'x-chain': 'solana',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });

    const body = await upstream.text();

    if (upstream.ok) {
      const ttl = CACHE_TTL_MS[joinedPath] ?? 60_000;
      responseCache.set(key, { expiresAt: now + ttl, status: upstream.status, body });
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
        'X-Birdeye-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[api/birdeye] upstream failed', joinedPath, err);
    if (cached) {
      return new NextResponse(cached.body, {
        status: cached.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Birdeye-Cache': 'STALE',
        },
      });
    }
    return NextResponse.json(
      { error: 'Birdeye upstream request failed.' },
      { status: 502 }
    );
  }
}
