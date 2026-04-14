/**
 * SupabaseWatchlistService — token watchlist persistence per wallet.
 *
 * Schema: see supabase/migrations/0001_init_state.sql
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface WatchlistEntry {
  id: string;
  walletAddress: string;
  mint: string;
  symbol: string | null;
  addedAt: string;
}

interface WatchlistRow {
  id: string;
  wallet_address: string;
  mint: string;
  symbol: string | null;
  added_at: string;
}

function rowToEntry(row: WatchlistRow): WatchlistEntry {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    mint: row.mint,
    symbol: row.symbol,
    addedAt: row.added_at,
  };
}

export class SupabaseWatchlistService {
  /** Throws a friendly error when Supabase env is not set. */
  private requireClient() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)');
    }
    return supabase;
  }

  async list(walletAddress: string): Promise<WatchlistEntry[]> {
    const client = this.requireClient();
    const { data, error } = await client
      .from('watchlist')
      .select('id, wallet_address, mint, symbol, added_at')
      .eq('wallet_address', walletAddress)
      .order('added_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => rowToEntry(row as WatchlistRow));
  }

  async add(walletAddress: string, mint: string, symbol?: string): Promise<WatchlistEntry> {
    const client = this.requireClient();
    const { data, error } = await client
      .from('watchlist')
      .insert({ wallet_address: walletAddress, mint, symbol: symbol ?? null })
      .select('id, wallet_address, mint, symbol, added_at')
      .single();
    if (error) throw new Error(error.message);
    return rowToEntry(data as WatchlistRow);
  }

  async remove(walletAddress: string, mint: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client
      .from('watchlist')
      .delete()
      .eq('wallet_address', walletAddress)
      .eq('mint', mint);
    if (error) throw new Error(error.message);
  }

  async isWatched(walletAddress: string, mint: string): Promise<boolean> {
    const client = this.requireClient();
    const { count, error } = await client
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('mint', mint);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
}
