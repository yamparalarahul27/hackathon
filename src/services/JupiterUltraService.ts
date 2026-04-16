/**
 * Jupiter Ultra Service
 *
 * Unified client for the Ultra tier of Jupiter APIs:
 *   - /ultra/v1/order      — quote + signed-ready tx
 *   - /ultra/v1/execute    — Jupiter broadcasts the signed tx
 *   - /ultra/v1/shield     — scam/spoof token warnings
 *   - /ultra/v1/holdings   — wallet token balances (replaces /balances)
 *   - /ultra/v1/search     — token search / metadata
 *
 * Real data only — no mocks, no fallback numbers. If the API fails, the
 * error propagates to the caller and the UI surfaces it explicitly.
 *
 * Docs: https://dev.jup.ag
 */

import { VersionedTransaction } from '@solana/web3.js';
import {
  JUPITER_ULTRA_ORDER_API,
  JUPITER_ULTRA_EXECUTE_API,
  JUPITER_ULTRA_SHIELD_API,
  JUPITER_ULTRA_HOLDINGS_API,
  JUPITER_ULTRA_SEARCH_API,
  jupiterHeaders,
} from '../lib/constants';

// ── Constants ────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// Common SPL mints — convenience references only. Discoverable tokens
// come from the search endpoint; nothing here is "hardcoded fallback".
export const TOKEN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
} as const;

// ── Public Types ─────────────────────────────────────────────────────

export interface UltraOrderParams {
  inputMint: string;
  outputMint: string;
  /** Native units (pre-decimals). */
  amount: number;
  /** Taker wallet address (required — without it Ultra returns a preview only). */
  taker?: string;
  slippageBps?: number;
}

export interface UltraRoutePlanStep {
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

export interface UltraOrder {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: UltraRoutePlanStep[];
  /** Present when `taker` was supplied. Base64-encoded VersionedTransaction. */
  transaction: string | null;
  /** Correlates a later /execute call. Present when `taker` was supplied. */
  requestId: string | null;
  prioritizationFeeLamports: number | null;
}

export interface UltraExecuteResult {
  status: string;
  signature: string;
}

export type ShieldSeverity = 'info' | 'warning' | 'critical';

export interface ShieldWarning {
  type: string;
  message: string;
  severity: ShieldSeverity;
}

export type ShieldMap = Record<string, ShieldWarning[]>;

export interface UltraSearchToken {
  id: string;                  // mint
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  usdPrice: number | null;
  mcap: number | null;
  liquidity: number | null;
  holderCount: number | null;
  organicScore: number | null;
  isVerified: boolean;
}

export interface UltraHolding {
  mint: string;
  amount: string;          // raw base units
  uiAmount: number;
  decimals: number;
  isFrozen: boolean;
  isAta: boolean;
}

// ── Raw response shapes ──────────────────────────────────────────────

interface RawOrderResponse {
  inputMint?: string;
  outputMint?: string;
  inAmount?: string;
  outAmount?: string;
  otherAmountThreshold?: string;
  swapMode?: string;
  slippageBps?: number;
  priceImpactPct?: string;
  routePlan?: UltraRoutePlanStep[];
  transaction?: string | null;
  requestId?: string;
  prioritizationFeeLamports?: number;
  errorCode?: number;
  errorMessage?: string;
}

interface RawExecuteResponse {
  status?: string;
  signature?: string;
  error?: string;
  errorMessage?: string;
  code?: number;
}

interface RawShieldResponse {
  warnings?: ShieldMap;
  error?: string;
}

interface RawSearchResponse {
  error?: string;
}

interface RawSearchToken {
  id?: string;
  name?: string;
  symbol?: string;
  icon?: string;
  decimals?: number;
  usdPrice?: number;
  mcap?: number;
  liquidity?: number;
  holderCount?: number;
  organicScore?: number;
  isVerified?: boolean;
}

interface RawHoldingsResponse {
  error?: string;
  [mintOrSymbol: string]: {
    amount?: string;
    uiAmount?: number;
    decimals?: number;
    isFrozen?: boolean;
    isAta?: boolean;
    slot?: number;
  } | string | undefined;
}

// ── Service ──────────────────────────────────────────────────────────

export class JupiterUltraService {
  // ─── /order ────────────────────────────────────────────────────────

  async getOrder(params: UltraOrderParams): Promise<UltraOrder> {
    const url = new URL(JUPITER_ULTRA_ORDER_API);
    url.searchParams.set('inputMint', params.inputMint);
    url.searchParams.set('outputMint', params.outputMint);
    url.searchParams.set('amount', params.amount.toString());
    if (params.taker) url.searchParams.set('taker', params.taker);
    if (params.slippageBps !== undefined) {
      url.searchParams.set('slippageBps', params.slippageBps.toString());
    }

    const response = await this.fetchWithRetry(url.toString(), {
      headers: jupiterHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Jupiter Ultra /order ${response.status}: ${body.slice(0, 200)}`);
    }
    const raw = (await response.json()) as RawOrderResponse;
    if (raw.errorMessage || raw.errorCode) {
      throw new Error(`Jupiter Ultra rejected order: ${raw.errorMessage ?? `code ${raw.errorCode}`}`);
    }
    return {
      inputMint: raw.inputMint ?? params.inputMint,
      outputMint: raw.outputMint ?? params.outputMint,
      inAmount: raw.inAmount ?? '0',
      outAmount: raw.outAmount ?? '0',
      otherAmountThreshold: raw.otherAmountThreshold ?? '0',
      priceImpactPct: raw.priceImpactPct ?? '0',
      slippageBps: raw.slippageBps ?? params.slippageBps ?? 50,
      routePlan: raw.routePlan ?? [],
      transaction: raw.transaction ?? null,
      requestId: raw.requestId ?? null,
      prioritizationFeeLamports: raw.prioritizationFeeLamports ?? null,
    };
  }

  // ─── /execute ──────────────────────────────────────────────────────

  async executeOrder(
    signedTransaction: VersionedTransaction,
    requestId: string
  ): Promise<UltraExecuteResult> {
    const signedBase64 = encodeBase64(signedTransaction.serialize());

    const response = await this.fetchWithRetry(JUPITER_ULTRA_EXECUTE_API, {
      method: 'POST',
      headers: jupiterHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ signedTransaction: signedBase64, requestId }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Jupiter Ultra /execute ${response.status}: ${body.slice(0, 200)}`);
    }
    const raw = (await response.json()) as RawExecuteResponse;
    if (raw.error || raw.errorMessage) {
      throw new Error(`Jupiter Ultra execute failed: ${raw.errorMessage ?? raw.error}`);
    }
    if (!raw.signature) {
      throw new Error('Jupiter Ultra execute returned no signature.');
    }
    return {
      status: raw.status ?? 'Unknown',
      signature: raw.signature,
    };
  }

  // ─── /shield ───────────────────────────────────────────────────────

  /** Fetch token safety warnings for a list of mints. */
  async getShield(mints: string[]): Promise<ShieldMap> {
    if (mints.length === 0) return {};
    const url = new URL(JUPITER_ULTRA_SHIELD_API);
    url.searchParams.set('mints', mints.join(','));

    const response = await this.fetchWithRetry(url.toString(), {
      headers: jupiterHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Jupiter Ultra /shield ${response.status}`);
    }
    const raw = (await response.json()) as RawShieldResponse;
    return raw.warnings ?? {};
  }

  // ─── /search ───────────────────────────────────────────────────────

  /** Search tokens by symbol, name, or mint. Up to 20 results. */
  async searchTokens(query: string): Promise<UltraSearchToken[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = new URL(JUPITER_ULTRA_SEARCH_API);
    url.searchParams.set('query', trimmed);

    const response = await this.fetchWithRetry(url.toString(), {
      headers: jupiterHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Jupiter Ultra /search ${response.status}`);
    }
    const raw = (await response.json()) as RawSearchToken[] | RawSearchResponse;
    if (!Array.isArray(raw)) {
      throw new Error(`Jupiter Ultra /search returned ${raw.error ?? 'an unexpected payload'}`);
    }

    return raw
      .filter((t): t is RawSearchToken & { id: string } => Boolean(t?.id))
      .map((t) => ({
        id: t.id,
        name: t.name ?? '',
        symbol: t.symbol ?? '',
        icon: t.icon ?? null,
        decimals: Number(t.decimals ?? 0),
        usdPrice: typeof t.usdPrice === 'number' ? t.usdPrice : null,
        mcap: typeof t.mcap === 'number' ? t.mcap : null,
        liquidity: typeof t.liquidity === 'number' ? t.liquidity : null,
        holderCount: typeof t.holderCount === 'number' ? t.holderCount : null,
        organicScore: typeof t.organicScore === 'number' ? t.organicScore : null,
        isVerified: Boolean(t.isVerified),
      }));
  }

  // ─── /holdings ─────────────────────────────────────────────────────

  /** Live wallet holdings keyed by mint. */
  async getHoldings(walletAddress: string): Promise<UltraHolding[]> {
    const url = `${JUPITER_ULTRA_HOLDINGS_API}/${walletAddress}`;

    const response = await this.fetchWithRetry(url, {
      headers: jupiterHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Jupiter Ultra /holdings ${response.status}`);
    }
    const raw = (await response.json()) as RawHoldingsResponse;
    if (raw.error) {
      throw new Error(`Jupiter Ultra /holdings error: ${raw.error}`);
    }

    const holdings: UltraHolding[] = [];
    for (const [key, value] of Object.entries(raw)) {
      if (key === 'error' || !value || typeof value === 'string') continue;
      holdings.push({
        mint: key,
        amount: value.amount ?? '0',
        uiAmount: typeof value.uiAmount === 'number' ? value.uiAmount : 0,
        decimals: typeof value.decimals === 'number' ? value.decimals : 0,
        isFrozen: Boolean(value.isFrozen),
        isAta: Boolean(value.isAta),
      });
    }
    return holdings;
  }

  // ─── Helpers ───────────────────────────────────────────────────────

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

    throw lastError instanceof Error ? lastError : new Error('Jupiter Ultra request failed after retries.');
  }
}

// ── Public helpers ────────────────────────────────────────────────────

/** Derive the highest severity present in a warnings array. */
export function maxShieldSeverity(warnings: ShieldWarning[] | undefined): ShieldSeverity | null {
  if (!warnings || warnings.length === 0) return null;
  const ranks: Record<ShieldSeverity, number> = { info: 0, warning: 1, critical: 2 };
  return warnings.reduce<ShieldSeverity>((acc, w) => (ranks[w.severity] > ranks[acc] ? w.severity : acc), 'info');
}

export function decodeBase64Transaction(value: string): VersionedTransaction {
  const bytes = decodeBase64(value);
  return VersionedTransaction.deserialize(bytes);
}

// ── Encoding helpers ─────────────────────────────────────────────────

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

function encodeBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
