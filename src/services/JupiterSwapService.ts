/**
 * Jupiter Swap Service
 *
 * Wraps Jupiter quote + swap APIs for token swaps on Solana mainnet.
 * Includes retry/jitter for quote & build requests and explicit confirmation
 * polling so we don't treat "sent" as "landed".
 */

import { Connection, VersionedTransaction, type RpcResponseAndContext, type SimulatedTransactionResponse } from '@solana/web3.js';

// ── Constants ──────────────────────────────────────────────────

const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap';
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

// ── Types ──────────────────────────────────────────────────────

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
    feeAmount: string;
    feeMint: string;
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

interface BuildSwapApiResponse {
  swapTransaction: string;
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  simulationError?: unknown;
}

interface BuiltSwapTransaction {
  transaction: VersionedTransaction;
  blockhash: string;
  lastValidBlockHeight: number | null;
  prioritizationFeeLamports: number | null;
  computeUnitLimit: number | null;
  simulationError: unknown;
}

// ── Service ────────────────────────────────────────────────────

export class JupiterSwapService {
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
   * Get a swap quote from Jupiter.
   * Amount is in the input token's smallest unit (e.g., lamports for SOL, 1e6 for USDC).
   */
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    const url = new URL(JUPITER_QUOTE_API);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('slippageBps', slippageBps.toString());

    const response = await this.fetchWithRetry(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter Quote API error: ${response.status} — ${error}`);
    }

    return response.json() as Promise<SwapQuote>;
  }

  /**
   * Get a swap quote for a human-readable amount.
   * Converts USD amount to token base units automatically.
   */
  async getQuoteForUsdAmount(
    outputMint: string,
    usdAmount: number,
    slippageBps = 50
  ): Promise<SwapQuote> {
    // USDC has 6 decimals
    const usdcBaseUnits = Math.floor(usdAmount * 1e6);

    return this.getQuote({
      inputMint: TOKEN_MINTS.USDC,
      outputMint,
      amount: usdcBaseUnits,
      slippageBps,
    });
  }

  /**
   * Build a swap transaction from a quote.
   * Returns a VersionedTransaction ready to be signed by the user's wallet.
   */
  async buildSwapTransaction(
    quote: SwapQuote,
    userPublicKey: string
  ): Promise<BuiltSwapTransaction> {
    const response = await this.fetchWithRetry(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter Swap API error: ${response.status} — ${error}`);
    }

    const payload = await response.json() as BuildSwapApiResponse;
    const decodedTx = decodeBase64(payload.swapTransaction);
    const transaction = VersionedTransaction.deserialize(decodedTx);

    return {
      transaction,
      blockhash: transaction.message.recentBlockhash,
      lastValidBlockHeight: payload.lastValidBlockHeight ?? null,
      prioritizationFeeLamports: payload.prioritizationFeeLamports ?? null,
      computeUnitLimit: payload.computeUnitLimit ?? null,
      simulationError: payload.simulationError ?? null,
    };
  }

  /**
   * Execute a full swap: quote → build tx → sign → send.
   * Requires a connected wallet that can sign transactions.
   */
  async executeSwap(
    params: SwapQuoteParams,
    userPublicKey: string,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    connection: Connection
  ): Promise<SwapResult> {
    const quote = await this.getQuote(params);
    const built = await this.buildSwapTransaction(quote, userPublicKey);

    if (built.simulationError) {
      throw new Error(`Jupiter simulation failed before signing: ${JSON.stringify(built.simulationError)}`);
    }

    const signedTx = await signTransaction(built.transaction);
    const simulation = await this.simulateSignedTransaction(connection, signedTx);
    if (simulation.value.err) {
      throw new Error(`Swap simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
      preflightCommitment: 'processed',
    });

    await this.waitForConfirmation(
      connection,
      txSignature,
      built.blockhash,
      built.lastValidBlockHeight
    );

    return {
      txSignature,
      inputAmount: Number(quote.inAmount),
      outputAmount: Number(quote.outAmount),
      priceImpact: parseFloat(quote.priceImpactPct),
      prioritizationFeeLamports: built.prioritizationFeeLamports,
      computeUnitLimit: built.computeUnitLimit,
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
    blockhash: string,
    lastValidBlockHeight: number | null
  ): Promise<void> {
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      const [statusResult, currentHeight] = await Promise.all([
        connection.getSignatureStatuses([signature]),
        lastValidBlockHeight ? connection.getBlockHeight('processed') : Promise.resolve(0),
      ]);

      const status = statusResult.value[0];
      if (status?.err) {
        throw new Error(`Swap transaction failed on-chain: ${JSON.stringify(status.err)}`);
      }

      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return;
      }

      if (lastValidBlockHeight && currentHeight > lastValidBlockHeight) {
        throw new Error('Swap transaction expired before confirmation. Please try again.');
      }

      await sleep(1_200);
    }

    if (lastValidBlockHeight) {
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );
      return;
    }

    await connection.confirmTransaction(signature, 'confirmed');
  }
}

// ── Mock Service (for devnet demo) ─────────────────────────────

export class MockJupiterSwapService {
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    // Simulate realistic swap rates
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    // Simple price simulation based on known token prices
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
          feeAmount: Math.floor(amount * 0.003).toString(),
          feeMint: inputMint,
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

  async buildSwapTransaction(): Promise<VersionedTransaction> {
    throw new Error('Mock service cannot build real transactions. Connect to mainnet for live swaps.');
  }

  async executeSwap(): Promise<SwapResult> {
    // Simulate a successful swap
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      txSignature: `mock_swap_${Date.now().toString(36)}`,
      inputAmount: 50_000_000, // 50 USDC
      outputAmount: 280_000_000, // ~0.28 SOL
      priceImpact: 0.12,
      prioritizationFeeLamports: null,
      computeUnitLimit: null,
    };
  }
}

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
