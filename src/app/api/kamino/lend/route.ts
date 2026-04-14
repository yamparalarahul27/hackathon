import { NextRequest, NextResponse } from 'next/server';
import { KaminoLendService } from '@/services/KaminoLendService';
import type { LendingMarketSnapshot } from '@/lib/lend-types';
import { withRpcFallback } from '@/lib/rpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESPONSE_CACHE_TTL_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === 'true';

let cached: { expiresAt: number; payload: LendingMarketSnapshot } | null = null;
let inFlight: Promise<LendingMarketSnapshot> | null = null;
const rateLimitState = new Map<string, { windowStart: number; count: number }>();

function getClientIp(request: NextRequest): string {
  if (TRUST_PROXY_HEADERS) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
  }

  const directIp = request.headers.get('cf-connecting-ip');
  if (directIp) return directIp.trim();
  return 'unknown';
}

function isRateLimited(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitState.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(ip, { windowStart: now, count: 1 });
    return { limited: false, retryAfterSeconds: 0 };
  }
  entry.count += 1;
  const retryAfterMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - entry.windowStart));
  return {
    limited: entry.count > RATE_LIMIT_MAX_REQUESTS,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

async function fetchSnapshot(): Promise<LendingMarketSnapshot> {
  return withRpcFallback((rpcUrl) => {
    const service = new KaminoLendService(rpcUrl);
    return service.getMainMarket();
  });
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = isRateLimited(ip);
  if (limit.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
        },
      }
    );
  }

  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60, stale-if-error=120',
        'X-Data-State': 'fresh-cache',
      },
    });
  }

  try {
    if (!inFlight) {
      inFlight = fetchSnapshot();
    }
    const payload = await inFlight;
    cached = { payload, expiresAt: now + RESPONSE_CACHE_TTL_MS };
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60, stale-if-error=120',
        'X-Data-State': 'live',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API/kamino/lend] Failed:', error);
    return NextResponse.json(
      { error: `Unable to load Kamino lending market: ${message}` },
      { status: 500 }
    );
  } finally {
    inFlight = null;
  }
}
