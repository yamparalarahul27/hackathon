/**
 * SupabaseWalletService — multi-wallet support per owner.
 *
 * Each "owner" wallet (the connected/signing wallet) can attach
 * additional read-only wallets to view positions across them.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface LinkedWallet {
  id: string;
  ownerAddress: string;
  walletAddress: string;
  label: string | null;
  isPrimary: boolean;
  addedAt: string;
}

interface LinkedWalletRow {
  id: string;
  owner_address: string;
  wallet_address: string;
  label: string | null;
  is_primary: boolean;
  added_at: string;
}

function rowToWallet(row: LinkedWalletRow): LinkedWallet {
  return {
    id: row.id,
    ownerAddress: row.owner_address,
    walletAddress: row.wallet_address,
    label: row.label,
    isPrimary: row.is_primary,
    addedAt: row.added_at,
  };
}

export class SupabaseWalletService {
  private requireClient() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)');
    }
    return supabase;
  }

  async list(ownerAddress: string): Promise<LinkedWallet[]> {
    const client = this.requireClient();
    const { data, error } = await client
      .from('user_wallets')
      .select('id, owner_address, wallet_address, label, is_primary, added_at')
      .eq('owner_address', ownerAddress)
      .order('added_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => rowToWallet(row as LinkedWalletRow));
  }

  async link(ownerAddress: string, walletAddress: string, label?: string, isPrimary = false): Promise<LinkedWallet> {
    const client = this.requireClient();
    const { data, error } = await client
      .from('user_wallets')
      .insert({
        owner_address: ownerAddress,
        wallet_address: walletAddress,
        label: label ?? null,
        is_primary: isPrimary,
      })
      .select('id, owner_address, wallet_address, label, is_primary, added_at')
      .single();
    if (error) throw new Error(error.message);
    return rowToWallet(data as LinkedWalletRow);
  }

  async unlink(ownerAddress: string, walletAddress: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client
      .from('user_wallets')
      .delete()
      .eq('owner_address', ownerAddress)
      .eq('wallet_address', walletAddress);
    if (error) throw new Error(error.message);
  }

  async setLabel(ownerAddress: string, walletAddress: string, label: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client
      .from('user_wallets')
      .update({ label })
      .eq('owner_address', ownerAddress)
      .eq('wallet_address', walletAddress);
    if (error) throw new Error(error.message);
  }
}
