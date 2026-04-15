/**
 * Jupiter Swap Service — Swap API V2 (/swap/v2/order)
 *
 * Aligned with Jupiter's current developer docs. V2's /order endpoint
 * returns both the quote AND the ready-to-sign transaction in a single
 * call when a taker is provided. Without a taker, it returns a quote
 * preview only. This lets us preserve the two-step UX (preview → confirm)
 * while reducing the API surface to one endpoint.
 *
 * Docs: https://developers.jup.ag
 */

import { Connection, VersionedTransaction, type RpcResponseAndContext, type SimulatedTransactionResponse } from '@solana/web3.js';
import {
  JUPITER_SWAP_ORDER_API,
  jupiterHeaders,
} from '../lib/constants';

// ── Constants ──────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// Common Solana token mints
export const TOKEN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
} as const;

// ── Public Types ───────────────────────────────────────────────

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  slippageBps: number;
}

interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
  };
  percent: number;
}

export interface SwapResult {
  txSignature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  prioritizationFeeLamports: number | null;
  computeUnitLimit: number | null;
}

export interface SwapQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

// ── V2 /order response shape (matches docs + live probe) ───────

interface JupiterOrderResponse {
  swapType: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  // Populated only when `taker` is provided + no error
  transaction?: string | null;
  requestId?: string;
  // Error fields (present on failure even with taker)
  errorCode?: number;
  errorMessage?: string;
  // Informational fee fields
  prioritizationFeeLamports?: number;
  rentFeeLamports?: number;
}

// ── Service ────────────────────────────────────────────────────

export class JupiterSwapService {
  private async fetchOrder(
    params: SwapQuoteParams,
    taker?: string
  ): Promise<JupiterOrderResponse> {
    const url = new URL(JUPITER_SWAP_ORDER_API);
    url.searchParams.set('inputMint', params.inputMint);
    url.searchParams.set('outputMint', params.outputMint);
    url.searchParams.set('amount', params.amount.toString());
    if (params.slippageBps !== undefined) {
      url.searchParams.set('slippageBps', params.slippageBps.toString());
    }
    if (taker) url.searchParams.set('taker', taker);

    const response = await this.fetchWithRetry(url.toString(), {
      headers: jupiterHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Jupiter /order ${response.status}: ${body.slice(0, 200)}`);
    }
    return response.json() as Promise<JupiterOrderResponse>;
  }

  private async fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (response.ok) return response;
        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxAttempts) {
          return response;
        }
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
      }
      await sleep(Math.floor((200 * (2 ** (attempt - 1))) + Math.random() * 250));
    }

    throw lastError instanceof Error ? lastError : new Error('Request to Jupiter failed after retries.');
  }

  /**
   * Preview a swap. Returns routing, amounts, and price impact without a
   * transaction. No wallet involved. Slippage defaults to 50 bps.
   */
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const slippageBps = params.slippageBps ?? 50;
    const order = await this.fetchOrder({ ...params, slippageBps });
    return {
      inputMint: order.inputMint,
      outputMint: order.outputMint,
      inAmount: order.inAmount,
      outAmount: order.outAmount,
      otherAmountThreshold: order.otherAmountThreshold,
      priceImpactPct: order.priceImpactPct,
      routePlan: order.routePlan,
      slippageBps: order.slippageBps ?? slippageBps,
    };
  }

  /** Convenience: quote USD into a target token (spends USDC). */
  async getQuoteForUsdAmount(
    outputMint: string,
    usdAmount: number,
    slippageBps = 50
  ): Promise<SwapQuote> {
    const usdcBaseUnits = Math.floor(usdAmount * 1e6); // USDC = 6 decimals
    return this.getQuote({
      inputMint: TOKEN_MINTS.USDC,
      outputMint,
      amount: usdcBaseUnits,
      slippageBps,
    });
  }

  /**
   * Full swap: /order (with taker) → decode → sign → send + confirm via RPC.
   */
  async executeSwap(
    params: SwapQuoteParams,
    userPublicKey: string,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    connection: Connection
  ): Promise<SwapResult> {
    const order = await this.fetchOrder(params, userPublicKey);

    if (order.errorMessage || order.errorCode) {
      throw new Error(`Jupiter swap rejected: ${order.errorMessage ?? `code ${order.errorCode}`}`);
    }
    if (!order.transaction) {
      throw new Error('Jupiter did not return a transaction for this order.');
    }

    const raw = decodeBase64(order.transaction);
    const tx = VersionedTransaction.deserialize(raw);

    const simulation = await connection.simulateTransaction(tx, {
      replaceRecentBlockhash: false,
      sigVerify: false,
      commitment: 'processed',
    });
    if (simulation.value.err) {
      throw new Error(`Swap simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    const signed = await signTransaction(tx);
    const postSignSimulation = await this.simulateSignedTransaction(connection, signed);
    if (postSignSimulation.value.err) {
      throw new Error(`Signed swap simulation failed: ${JSON.stringify(postSignSimulation.value.err)}`);
    }

    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
      preflightCommitment: 'processed',
    });

    await this.waitForConfirmation(connection, sig, tx.message.recentBlockhash);

    return {
      txSignature: sig,
      inputAmount: Number(order.inAmount),
      outputAmount: Number(order.outAmount),
      priceImpact: parseFloat(order.priceImpactPct),
      prioritizationFeeLamports: order.prioritizationFeeLamports ?? null,
      computeUnitLimit: null, // Not surfaced by V2 /order; left for future.
    };
  }

  private async simulateSignedTransaction(
    connection: Connection,
    transaction: VersionedTransaction
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    return connection.simulateTransaction(transaction, {
      replaceRecentBlockhash: false,
      sigVerify: false,
      commitment: 'processed',
    });
  }

  private async waitForConfirmation(
    connection: Connection,
    signature: string,
    blockhash: string
  ): Promise<void> {
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      const statusResult = await connection.getSignatureStatuses([signature]);
      const status = statusResult.value[0];
      if (status?.err) {
        throw new Error(`Swap transaction failed on-chain: ${JSON.stringify(status.err)}`);
      }
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return;
      }
      await sleep(1_200);
    }

    // Timeout safety net — let Solana drop or finalize.
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight: await connection.getBlockHeight('processed') }, 'confirmed');
  }
}

// ── Mock Service (devnet demo) ─────────────────────────────────

export class MockJupiterSwapService {
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    const prices: Record<string, number> = {
      [TOKEN_MINTS.USDC]: 1.0,
      [TOKEN_MINTS.SOL]: 178.50,
      [TOKEN_MINTS.USDT]: 1.0,
      [TOKEN_MINTS.ETH]: 3420,
      [TOKEN_MINTS.JUP]: 1.15,
      [TOKEN_MINTS.JTO]: 4.20,
      [TOKEN_MINTS.BONK]: 0.000035,
    };

    const inputPrice = prices[inputMint] ?? 1;
    const outputPrice = prices[outputMint] ?? 1;
    const inputDecimals = inputMint === TOKEN_MINTS.SOL ? 9 : 6;
    const outputDecimals = outputMint === TOKEN_MINTS.SOL ? 9 : 6;
    const inputUsd = (amount / (10 ** inputDecimals)) * inputPrice;
    const outputTokens = inputUsd / outputPrice;
    const outAmount = Math.floor(outputTokens * (10 ** outputDecimals));

    return {
      inputMint,
      outputMint,
      inAmount: amount.toString(),
      outAmount: outAmount.toString(),
      otherAmountThreshold: Math.floor(outAmount * (1 - slippageBps / 10000)).toString(),
      priceImpactPct: '0.12',
      slippageBps,
      routePlan: [{
        swapInfo: {
          ammKey: 'mock-amm-key',
          label: 'Orca Whirlpool',
          inputMint,
          outputMint,
          inAmount: amount.toString(),
          outAmount: outAmount.toString(),
        },
        percent: 100,
      }],
    };
  }

  async getQuoteForUsdAmount(
    outputMint: string,
    usdAmount: number,
    slippageBps = 50
  ): Promise<SwapQuote> {
    const usdcBaseUnits = Math.floor(usdAmount * 1e6);
    return this.getQuote({
      inputMint: TOKEN_MINTS.USDC,
      outputMint,
      amount: usdcBaseUnits,
      slippageBps,
    });
  }

  async executeSwap(): Promise<SwapResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      txSignature: `mock_swap_${Date.now().toString(36)}`,
      inputAmount: 50_000_000,
      outputAmount: 280_000_000,
      priceImpact: 0.12,
      prioritizationFeeLamports: null,
      computeUnitLimit: null,
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────

function decodeBase64(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
