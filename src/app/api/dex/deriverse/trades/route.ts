import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { DeriverseTradeService } from '@/services/DeriverseTradeService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const CACHE_TTL_MS = 30_000;

const rateLimitState = new Map<string, { windowStart: number; count: number }>();
const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitState.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Check cache
  const now = Date.now();
  const cached = responseCache.get(wallet);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload);
  }

  const rpcUrl = process.env.HELIUS_DEVNET_RPC_URL ?? '';
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'HELIUS_DEVNET_RPC_URL not configured' },
      { status: 500 }
    );
  }

  try {
    const service = new DeriverseTradeService(rpcUrl);
    const trades = await service.getTrades(wallet);

    const payload = {
      network: 'devnet',
      wallet,
      trades,
      tradeCount: trades.length,
      fetchedAt: new Date().toISOString(),
    };

    responseCache.set(wallet, { expiresAt: now + CACHE_TTL_MS, payload });

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    });
  } catch (error) {
    console.error('[API/dex/deriverse/trades] Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
