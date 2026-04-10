/**
 * Dodo Payments Service
 *
 * Handles fiat payment checkout sessions via Dodo Payments SDK.
 * Creates checkout sessions for vault deposits and tracks payment status.
 *
 * NOTE: This service runs server-side only (API routes).
 * For client-side, use the API route at /api/payments.
 */

import DodoPayments from 'dodopayments';

// Product ID for "DeFi Vault Deposit" — create this in your Dodo dashboard
// This is a one-time payment product that represents USDC being deposited
const VAULT_DEPOSIT_PRODUCT_ID = process.env.DODO_VAULT_PRODUCT_ID ?? 'prod_placeholder';

export interface CreateCheckoutParams {
  /** Fiat amount to charge */
  amount: number;
  /** Currency code (INR, USD, etc.) */
  currency: string;
  /** Target Kamino vault address */
  vaultAddress: string;
  /** User's Solana wallet address */
  walletAddress: string;
  /** URL to redirect after success */
  successUrl: string;
  /** URL to redirect on cancel */
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  checkoutUrl: string | null;
}

export class DodoPaymentService {
  private client: DodoPayments;

  constructor() {
    const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

    this.client = new DodoPayments({
      bearerToken,
      environment: (process.env.DODO_PAYMENTS_ENV as 'test_mode' | 'live_mode') ?? 'test_mode',
    });
  }

  /**
   * Create a checkout session for a vault deposit.
   * Returns a checkout URL the user should be redirected to.
   */
  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    console.log('[DodoPaymentService] Creating checkout session:', {
      amount: params.amount,
      currency: params.currency,
      vault: params.vaultAddress,
    });

    const session = await this.client.checkoutSessions.create({
      product_cart: [
        {
          product_id: VAULT_DEPOSIT_PRODUCT_ID,
          quantity: 1,
        },
      ],
      billing_currency: params.currency.toUpperCase() as any,
      return_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        vault_address: params.vaultAddress,
        wallet_address: params.walletAddress,
        fiat_amount: String(params.amount),
        fiat_currency: params.currency,
      },
    });

    console.log('[DodoPaymentService] Checkout session created:', session.session_id);

    return {
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url ?? null,
    };
  }

  /**
   * Check the status of a checkout session.
   */
  async getSessionStatus(sessionId: string) {
    return this.client.checkoutSessions.retrieve(sessionId);
  }

  /**
   * Retrieve payment details by ID.
   */
  async getPayment(paymentId: string) {
    return this.client.payments.retrieve(paymentId);
  }
}
