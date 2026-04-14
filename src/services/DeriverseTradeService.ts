/**
 * Deriverse Trade Service
 *
 * Parses real Deriverse DEX trades from devnet on-chain data.
 * Uses @deriverse/kit Engine.logsDecode() to decode program logs,
 * then maps SpotFillOrderReportModel / PerpFillOrderReportModel
 * into our DexTrade type.
 *
 * Pipeline: getSignaturesForAddress → getParsedTransaction → logsDecode → DexTrade[]
 *
 * References: github.com/yamparalarahul27/Deriverse
 */

import { Connection, type ParsedTransactionWithMeta } from '@solana/web3.js';
import { Engine, PROGRAM_ID as DERIVERSE_PROGRAM_ID } from '@deriverse/kit';
import { createSolanaRpc } from '@solana/kit';
import type {
  SpotFillOrderReportModel,
  PerpFillOrderReportModel,
  SpotFeesReportModel,
  PerpFeesReportModel,
} from '@deriverse/kit';
import type { DexTrade } from '../lib/dex-types';

// ── Constants ──────────────────────────────────────────────────

const PRICE_DECIMALS = 1e9;
const ASSET_DECIMALS = 1e9;
const QUOTE_DECIMALS = 1e6;

const INSTRUMENT_SYMBOLS: Record<number, string> = {
  0: 'SOL-USDC',
};

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 600;
const MAX_SIGNATURES = 200;

// ── Service ────────────────────────────────────────────────────

export class DeriverseTradeService {
  private connection: Connection;
  private engine: Engine;

  constructor(devnetRpcUrl: string) {
    if (!devnetRpcUrl) throw new Error('DeriverseTradeService requires a devnet RPC URL');
    this.connection = new Connection(devnetRpcUrl, 'confirmed');
    const rpc = createSolanaRpc(devnetRpcUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.engine = new Engine(rpc as any, { uiNumbers: false });
  }

  /**
   * Fetch and parse Deriverse trades for a wallet on devnet.
   */
  async getTrades(walletAddress: string): Promise<DexTrade[]> {
    console.log(`[DeriverseTradeService] Fetching trades for ${walletAddress} on devnet...`);

    // 1. Get recent transaction signatures
    const signatures = await this.connection.getSignaturesForAddress(
      new (await import('@solana/web3.js')).PublicKey(walletAddress),
      { limit: MAX_SIGNATURES },
      'confirmed'
    );

    console.log(`[DeriverseTradeService] Found ${signatures.length} signatures`);

    if (signatures.length === 0) return [];

    // 2. Fetch + parse transactions in batches
    const trades: DexTrade[] = [];
    const sigStrings = signatures.map((s) => s.signature);

    for (let i = 0; i < sigStrings.length; i += BATCH_SIZE) {
      const batch = sigStrings.slice(i, i + BATCH_SIZE);
      const txs = await this.connection.getParsedTransactions(batch, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });

      for (let j = 0; j < txs.length; j++) {
        const tx = txs[j];
        if (!tx?.meta?.logMessages) continue;

        // Only process transactions that involve Deriverse program
        const isDerivverse = tx.meta.logMessages.some(
          (log) => log.includes(DERIVERSE_PROGRAM_ID)
        );
        if (!isDerivverse) continue;

        const parsed = this.parseTx(tx, batch[j]);
        trades.push(...parsed);
      }

      // Rate-limit friendly
      if (i + BATCH_SIZE < sigStrings.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    console.log(`[DeriverseTradeService] Parsed ${trades.length} trades`);

    // Sort by time descending
    return trades.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  }

  // ── Parse a single transaction ──────────────────────────────

  private parseTx(tx: ParsedTransactionWithMeta, signature: string): DexTrade[] {
    const logs = tx.meta?.logMessages ?? [];
    const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

    let messages;
    try {
      messages = this.engine.logsDecode(logs);
    } catch {
      return [];
    }

    const trades: DexTrade[] = [];
    const feesMap = new Map<number, number>(); // orderId → fee

    // First pass: collect fees
    for (const msg of messages) {
      if (this.isSpotFees(msg)) {
        feesMap.set(msg.refClientId, (msg.fees ?? 0) / QUOTE_DECIMALS);
      }
      if (this.isPerpFees(msg)) {
        feesMap.set(msg.refClientId, (msg.fees ?? 0) / QUOTE_DECIMALS);
      }
    }

    // Second pass: collect fills
    for (const msg of messages) {
      if (this.isSpotFill(msg)) {
        const symbol = INSTRUMENT_SYMBOLS[0] ?? 'UNKNOWN';
        const [base] = symbol.split('-');
        const side = msg.side === 0 ? 'buy' : 'sell';
        const qty = msg.qty / ASSET_DECIMALS;
        const price = msg.price / PRICE_DECIMALS;
        const notional = msg.crncy / QUOTE_DECIMALS;
        const fee = feesMap.get(msg.clientId) ?? (msg.rebates / QUOTE_DECIMALS);

        trades.push({
          id: `${signature}-spot-${msg.orderId}-${msg.seqNo}`,
          symbol: base ?? 'SOL',
          quoteCurrency: 'USDC',
          side,
          orderType: 'limit',
          quantity: qty,
          price,
          notional: Math.abs(notional),
          pnl: notional, // For spot: notional reflects trade P&L direction
          fee: Math.abs(fee),
          feeCurrency: 'USDC',
          openedAt: blockTime,
          closedAt: blockTime,
          durationSeconds: 0,
          isWin: notional > 0,
          txSignature: signature,
        });
      }

      if (this.isPerpFill(msg)) {
        const symbol = INSTRUMENT_SYMBOLS[0] ?? 'UNKNOWN';
        const [base] = symbol.split('-');
        const side = msg.side === 0 ? 'long' : 'short';
        const qty = msg.perps / ASSET_DECIMALS;
        const price = msg.price / PRICE_DECIMALS;
        const pnl = msg.crncy / QUOTE_DECIMALS;
        const fee = feesMap.get(msg.clientId) ?? (msg.rebates / QUOTE_DECIMALS);

        trades.push({
          id: `${signature}-perp-${msg.orderId}-${msg.seqNo}`,
          symbol: base ?? 'SOL',
          quoteCurrency: 'USDC',
          side,
          orderType: 'limit',
          quantity: Math.abs(qty),
          price,
          notional: Math.abs(qty * price),
          pnl,
          fee: Math.abs(fee),
          feeCurrency: 'USDC',
          openedAt: blockTime,
          closedAt: blockTime,
          durationSeconds: 0,
          isWin: pnl > 0,
          txSignature: signature,
        });
      }
    }

    return trades;
  }

  // ── Type guards ──────────────────────────────────────────────

  private isSpotFill(msg: unknown): msg is SpotFillOrderReportModel {
    return (msg as SpotFillOrderReportModel)?.tag === 11;
  }

  private isPerpFill(msg: unknown): msg is PerpFillOrderReportModel {
    return (msg as PerpFillOrderReportModel)?.tag === 19;
  }

  private isSpotFees(msg: unknown): msg is SpotFeesReportModel {
    return (msg as SpotFeesReportModel)?.tag === 15;
  }

  private isPerpFees(msg: unknown): msg is PerpFeesReportModel {
    return (msg as PerpFeesReportModel)?.tag === 23;
  }
}
