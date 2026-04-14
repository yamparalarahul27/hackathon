import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { fetchNftsByOwner } from '@/services/HeliusNftService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; payload: unknown }>();

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }
  try { new PublicKey(wallet); } catch {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const now = Date.now();
  const cached = cache.get(wallet);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload);
  }

  const rpcUrl = process.env.HELIUS_RPC_URL ?? process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? '';
  if (!rpcUrl) {
    return NextResponse.json({ error: 'Helius RPC not configured' }, { status: 500 });
  }

  try {
    const result = await fetchNftsByOwner(wallet, rpcUrl);
    const payload = { ...result, wallet, fetchedAt: new Date().toISOString() };
    cache.set(wallet, { expiresAt: now + CACHE_TTL_MS, payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[API/nft/holdings]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
