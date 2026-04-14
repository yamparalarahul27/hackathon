import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { KaminoVaultService } from '@/services/KaminoVaultService';
import type { KaminoVaultInfo, KaminoVaultPosition, LPPortfolioSummary } from '@/lib/lp-types';
import { withRpcFallback } from '@/lib/rpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface KaminoOverviewResponse {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  lastUpdated: string;
}

const RESPONSE_CACHE_TTL_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === 'true';

const responseCache = new Map<string, { expiresAt: number; payload: KaminoOverviewResponse }>();
const inFlightRequests = new Map<string, Promise<KaminoOverviewResponse>>();
const rateLimitState = new Map<string, { windowStart: number; count: number }>();

function extractIp(request: NextRequest): string {
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

function getRateLimitKey(request: NextRequest, walletAddress: string | null): string {
  const ip = extractIp(request);
  const walletPart = walletAddress ? walletAddress.slice(0, 8) : 'anon';
  return `${ip}:${walletPart}`;
}

function isRateLimited(key: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitState.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(key, { windowStart: now, count: 1 });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  const retryAfterMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - entry.windowStart));
  return {
    limited: entry.count > RATE_LIMIT_MAX_REQUESTS,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

function isValidWalletAddress(walletAddress: string): boolean {
  try {
    new PublicKey(walletAddress);
    return true;
  } catch {
    return false;
  }
}

async function fetchOverview(walletAddress: string | null): Promise<KaminoOverviewResponse> {
  return withRpcFallback(async (rpcUrl) => {
    const service = new KaminoVaultService(rpcUrl);
    const vaults = await service.getVaults();
    const positions = walletAddress ? await service.getUserPositions(walletAddress) : [];
    const summary = service.calculateSummary(positions);

    return {
      vaults,
      positions,
      summary,
      lastUpdated: new Date().toISOString(),
    };
  });
}

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get('wallet');
  const limit = isRateLimited(getRateLimitKey(request, walletAddress));
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

  if (walletAddress && !isValidWalletAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'Invalid wallet address.' },
      { status: 400 }
    );
  }

  const cacheKey = walletAddress ?? 'anon';
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60, stale-if-error=120',
        'X-Data-State': 'fresh-cache',
      },
    });
  }

  try {
    let inFlight = inFlightRequests.get(cacheKey);
    if (!inFlight) {
      inFlight = fetchOverview(walletAddress);
      inFlightRequests.set(cacheKey, inFlight);
    }

    const payload = await inFlight;
    responseCache.set(cacheKey, {
      payload,
      expiresAt: now + RESPONSE_CACHE_TTL_MS,
    });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60, stale-if-error=120',
        'X-Data-State': 'live',
      },
    });
  } catch (error) {
    console.error('[API/kamino/overview] Failed to fetch overview:', error);
    return NextResponse.json(
      { error: 'Unable to fetch live vault data right now.' },
      { status: 500 }
    );
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
