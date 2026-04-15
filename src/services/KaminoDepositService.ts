/**
 * Kamino Deposit Service — real K-Vault deposits via Kamino's Tx API.
 *
 * POST /ktx/kvault/deposit returns a base64-encoded, ready-to-sign
 * VersionedTransaction. We decode, hand it to the wallet adapter to
 * sign, and submit via the app's RPC connection.
 *
 * Only K-Vaults are supported by this endpoint (aligns with /kvaults/*).
 */

import {
  Connection,
  VersionedTransaction,
} from '@solana/web3.js';
import { KaminoApiClient } from './KaminoApiClient';

// ── Types ──────────────────────────────────────────────────────────

export interface DepositParams {
  vaultAddress: string;
  userWallet: string;
  /** Decimal amount of the vault's deposit token, NOT lamports. */
  tokenAmount: number;
}

export interface DepositResult {
  txSignature: string;
  vaultAddress: string;
  amountDeposited: number;
}

export type SignTransactionFn = (
  tx: VersionedTransaction
) => Promise<VersionedTransaction>;

// ── Service ────────────────────────────────────────────────────────

export class KaminoDepositService {
  private connection: Connection;
  private api: KaminoApiClient;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.api = new KaminoApiClient();
  }

  /**
   * Execute a K-Vault deposit end-to-end:
   *   1. Ask Kamino to build the tx
   *   2. Decode base64 → VersionedTransaction
   *   3. User signs via wallet adapter
   *   4. Send + confirm via RPC
   */
  async deposit(
    params: DepositParams,
    signTransaction: SignTransactionFn
  ): Promise<DepositResult> {
    if (!Number.isFinite(params.tokenAmount) || params.tokenAmount <= 0) {
      throw new Error('Deposit amount must be a positive number.');
    }

    // 1. Build tx via Kamino API
    const { transaction } = await this.api.buildDepositTx({
      wallet: params.userWallet,
      kvault: params.vaultAddress,
      amount: params.tokenAmount.toString(),
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
      amountDeposited: params.tokenAmount,
    };
  }
}
