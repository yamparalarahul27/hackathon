/**
 * Kamino Lending Service
 *
 * Reads klend (Kamino Lending) reserve data from the Main Market on mainnet.
 * Mirrors what kamino.com/lend displays.
 *
 * Uses @kamino-finance/klend-sdk + @solana/kit RPC client.
 */

import { KaminoMarket, type KaminoReserve } from '@kamino-finance/klend-sdk';
import { address, createSolanaRpc } from '@solana/kit';
import { KAMINO_MAIN_MARKET } from '../lib/constants';
import type { LendingMarketSnapshot, LendingReserve } from '../lib/lend-types';

/** Mainnet slot duration. ~400ms per slot. */
const SLOT_DURATION_MS = 400;

export class KaminoLendService {
  // Use any to bypass deep RPC type mismatches between our @solana/kit version
  // and the one bundled inside klend-sdk. Behavior is identical at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rpc: any;

  constructor(rpcUrl: string) {
    if (!rpcUrl) throw new Error('KaminoLendService requires an RPC URL');
    this.rpc = createSolanaRpc(rpcUrl);
  }

  /**
   * Load Main Market with all reserves and return snapshot.
   */
  async getMainMarket(): Promise<LendingMarketSnapshot> {
    const marketAddress = address(KAMINO_MAIN_MARKET);

    const market = await KaminoMarket.load(
      this.rpc,
      marketAddress,
      SLOT_DURATION_MS,
      undefined, // default klend program ID
      true,      // withReserves
    );

    if (!market) {
      throw new Error(`Failed to load Kamino Main Market at ${KAMINO_MAIN_MARKET}`);
    }

    const slotResp = await this.rpc.getSlot().send();
    const currentSlot = BigInt(slotResp);

    const reserves = market.getReserves();
    const reserveData: LendingReserve[] = reserves
      .map((reserve) => this.mapReserve(reserve, currentSlot))
      .filter((r): r is LendingReserve => r !== null)
      // Sort by total supply USD desc — biggest markets first
      .sort((a, b) => b.totalSupplyUsd - a.totalSupplyUsd);

    return {
      market: {
        marketAddress: KAMINO_MAIN_MARKET,
        totalSupplyUsd: market.getTotalDepositTVL().toNumber(),
        totalBorrowUsd: market.getTotalBorrowTVL().toNumber(),
        reserveCount: reserveData.length,
      },
      reserves: reserveData,
      lastUpdated: new Date().toISOString(),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private mapReserve(reserve: KaminoReserve, currentSlot: bigint): LendingReserve | null {
    try {
      const stats = reserve.stats;
      const symbol = reserve.getTokenSymbol();
      const mint = reserve.getLiquidityMint().toString();

      const supplyApy = reserve.totalSupplyAPY(currentSlot);
      const borrowApy = reserve.totalBorrowAPY(currentSlot);
      const utilization = reserve.calculateUtilizationRatio();
      const priceUsd = reserve.getOracleMarketPrice().toNumber();

      const depositTvl = reserve.getDepositTvl().toNumber();
      const borrowTvl = reserve.getBorrowTvl().toNumber();

      return {
        address: reserve.address.toString(),
        mint,
        symbol,
        decimals: stats.decimals,
        priceUsd,
        supplyApy,
        borrowApy,
        totalSupplyUsd: depositTvl,
        totalBorrowUsd: borrowTvl,
        utilization,
        loanToValue: stats.loanToValue,
        liquidationThreshold: stats.liquidationThreshold,
        status: String(stats.status),
      };
    } catch (err) {
      console.warn('[KaminoLendService] Failed to map reserve:', err);
      return null;
    }
  }
}
