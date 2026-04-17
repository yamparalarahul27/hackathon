/**
 * Kamino Withdraw Service — real K-Vault withdrawals via Kamino's Tx API.
 *
 * POST /ktx/kvault/withdraw returns a base64-encoded, ready-to-sign
 * VersionedTransaction. We decode, hand it to the wallet adapter to
 * sign, and submit via the app's RPC connection.
 *
 * Mirrors KaminoDepositService exactly — same 4-step flow.
 */

import {
  Connection,
  VersionedTransaction,
} from '@solana/web3.js';
import { KaminoApiClient } from './KaminoApiClient';
import type { WithdrawParams, WithdrawResult, SignTransactionFn } from '@/lib/lp-types';

// ── Service ────────────────────────────────────────────────────────

export class KaminoWithdrawService {
  private connection: Connection;
  private api: KaminoApiClient;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.api = new KaminoApiClient();
  }

  /**
   * Execute a K-Vault withdrawal end-to-end:
   *   1. Ask Kamino to build the tx
   *   2. Decode base64 → VersionedTransaction
   *   3. User signs via wallet adapter
   *   4. Send + confirm via RPC
   */
  async withdraw(
    params: WithdrawParams,
    signTransaction: SignTransactionFn
  ): Promise<WithdrawResult> {
    if (!Number.isFinite(params.shareAmount) || params.shareAmount <= 0) {
      throw new Error('Withdraw amount must be a positive number.');
    }

    // 1. Build tx via Kamino API
    const { transaction } = await this.api.buildWithdrawTx({
      wallet: params.userWallet,
      kvault: params.vaultAddress,
      amount: params.shareAmount.toString(),
    });

    // 2. Decode
    const raw = Buffer.from(transaction, 'base64');
    const tx = VersionedTransaction.deserialize(raw);

    // 3. Sign via wallet adapter
    const signed = await signTransaction(tx);

    // 4. Send + confirm
    const sig = await this.connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    await this.connection.confirmTransaction(sig, 'confirmed');

    return {
      txSignature: sig,
      vaultAddress: params.vaultAddress,
      sharesWithdrawn: params.shareAmount,
    };
  }
}
