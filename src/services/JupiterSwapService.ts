/**
 * Jupiter Swap Service
 *
 * Wraps the Jupiter v6 Quote + Swap API for token swaps on Solana.
 * Used in the DexPilot deposit flow: USDC → vault token pair.
 *
 * API: https://station.jup.ag/docs/apis/swap-api
 * Cost: FREE (public API, no key required)
 * Networks: Mainnet only (Jupiter does not support devnet)
 *
 * For devnet demo: use mock mode which simulates swap quotes.
 */

import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';

// ── Constants ──────────────────────────────────────────────────

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

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
}

export interface SwapQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

// ── Service ────────────────────────────────────────────────────

export class JupiterSwapService {
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

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter Quote API error: ${response.status} — ${error}`);
    }

    return response.json();
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
  ): Promise<VersionedTransaction> {
    const response = await fetch(JUPITER_SWAP_API, {
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

    const { swapTransaction } = await response.json();

    // Deserialize the base64-encoded transaction
    const txBuffer = Buffer.from(swapTransaction, 'base64');
    return VersionedTransaction.deserialize(txBuffer);
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
    // 1. Get quote
    const quote = await this.getQuote(params);

    // 2. Build transaction
    const transaction = await this.buildSwapTransaction(quote, userPublicKey);

    // 3. Sign transaction via wallet
    const signedTx = await signTransaction(transaction);

    // 4. Send and confirm
    const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // 5. Wait for confirmation
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txSignature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    return {
      txSignature,
      inputAmount: Number(quote.inAmount),
      outputAmount: Number(quote.outAmount),
      priceImpact: parseFloat(quote.priceImpactPct),
    };
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
    };
  }
}
