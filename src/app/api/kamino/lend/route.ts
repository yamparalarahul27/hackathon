import { NextRequest, NextResponse } from 'next/server';
import { KaminoLendService } from '@/services/KaminoLendService';
import type { LendingMarketSnapshot } from '@/lib/lend-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESPONSE_CACHE_TTL_MS = 30_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

let cached: { expiresAt: number; payload: LendingMarketSnapshot } | null = null;
let inFlight: Promise<LendingMarketSnapshot> | null = null;
const rateLimitState = new Map<string, { windowStart: number; count: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitState.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

async function fetchSnapshot(): Promise<LendingMarketSnapshot> {
  const rpcUrl =
    process.env.HELIUS_RPC_URL ??
    process.env.QUICKNODE_RPC_URL ??
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??
    process.env.NEXT_PUBLIC_QUICKNODE_RPC ??
    '';
  if (!rpcUrl) {
    throw new Error('No Solana RPC URL configured (HELIUS_RPC_URL or QUICKNODE_RPC_URL)');
  }
  const service = new KaminoLendService(rpcUrl);
  return service.getMainMarket();
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    });
  }

  try {
    if (!inFlight) {
      inFlight = fetchSnapshot();
    }
    const payload = await inFlight;
    cached = { payload, expiresAt: now + RESPONSE_CACHE_TTL_MS };
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=15' },
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
