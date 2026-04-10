/**
 * POST /api/checkout
 *
 * Creates a Dodo Payments checkout session for a vault deposit.
 * Returns the checkout URL for the client to redirect to.
 *
 * Request body:
 * {
 *   amount: number,       // fiat amount
 *   currency: string,     // "INR" | "USD"
 *   vaultAddress: string, // target Kamino vault
 *   walletAddress: string // user's Solana wallet
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { DodoPaymentService } from '@/services/DodoPaymentService';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');

export async function POST(request: NextRequest) {
  try {
    // Validate origin to prevent open redirect attacks
    const origin = request.headers.get('origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { error: 'Forbidden: invalid origin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, currency, vaultAddress, walletAddress } = body;

    // Validate required fields
    if (!amount || !currency || !vaultAddress || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, vaultAddress, walletAddress' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    const service = new DodoPaymentService();
    const result = await service.createCheckoutSession({
      amount,
      currency,
      vaultAddress,
      walletAddress,
      successUrl: `${origin}/#vaults?payment=success&session={session_id}`,
      cancelUrl: `${origin}/#deposit?payment=cancelled`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API/checkout] Error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
