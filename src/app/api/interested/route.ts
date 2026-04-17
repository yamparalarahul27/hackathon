import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COUNTER_ID = 'landing_interest';

/**
 * GET  /api/interested  → { count: number }
 * POST /api/interested  → increments, returns { count: number }
 *
 * Supabase table: `counters` with columns `id` (text PK), `count` (int8).
 * If Supabase is not configured, falls back to in-memory (resets on redeploy).
 */

let memoryCount = 0;

async function getCount(): Promise<number> {
  if (!supabase) return memoryCount;
  const { data } = await supabase
    .from('counters')
    .select('count')
    .eq('id', COUNTER_ID)
    .single();
  return typeof data?.count === 'number' ? data.count : 0;
}

async function increment(): Promise<number> {
  if (!supabase) {
    memoryCount += 1;
    return memoryCount;
  }
  const { data } = await supabase.rpc('increment_counter', { counter_id: COUNTER_ID });
  return typeof data === 'number' ? data : (await getCount());
}

export async function GET() {
  try {
    const count = await getCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  const fingerprint = `interested:${ip}`;

  if (supabase) {
    const { data: existing } = await supabase
      .from('counter_votes')
      .select('id')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (existing) {
      const count = await getCount();
      return NextResponse.json({ count, alreadyVoted: true });
    }

    try { await supabase.from('counter_votes').insert({ fingerprint }); } catch { /* duplicate ok */ }
  }

  try {
    const count = await increment();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
