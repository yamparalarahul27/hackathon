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

const responseCache = new Map<string, { expiresAt: number; payload: KaminoOverviewResponse }>();
const inFlightRequests = new Map<string, Promise<KaminoOverviewResponse>>();
const rateLimitState = new Map<string, { windowStart: number; count: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitState.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(clientIp, { windowStart: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
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
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  const walletAddress = request.nextUrl.searchParams.get('wallet');
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
      headers: { 'Cache-Control': 'private, max-age=15' },
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
      headers: { 'Cache-Control': 'private, max-age=15' },
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
