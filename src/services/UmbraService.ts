/**
 * Umbra Privacy Service — encrypted balance operations via Umbra SDK.
 *
 * ALL @umbra-privacy/sdk imports are dynamic to keep the 16 MB bundle
 * out of the main chunk. This file is the ONLY place the SDK is imported.
 *
 * The wallet adapter ↔ IUmbraSigner bridge converts the Jupiter/web3.js
 * wallet adapter interface into the Umbra-native signer interface.
 *
 * NOTE: The Umbra SDK uses branded nominal types (Address, U64) that
 * cannot be constructed from plain strings/bigints at compile time.
 * At runtime, plain values work. We use `as unknown as X` casts at the
 * SDK boundary to bridge the gap.
 */

import type { VersionedTransaction } from '@solana/web3.js';

// ── Types (avoid importing SDK at module scope) ────────────────────

export interface UmbraServiceConfig {
  rpcUrl: string;
  wssUrl: string;
  indexerUrl: string;
  network: 'devnet' | 'mainnet' | 'localnet';
}

export interface WalletAdapterSigner {
  address: string;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

export interface EncryptedBalance {
  mint: string;
  amount: bigint;
}

// ── Signer Bridge ──────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Build an IUmbraSigner-compatible object from the wallet adapter.
 *
 * Umbra's SignableTransaction is a Kit Transaction with `messageBytes`
 * and `signatures`. We deserialize into web3.js VersionedTransaction,
 * sign, and graft the signature back.
 */
function createUmbraSigner(wallet: WalletAdapterSigner): any {
  const signer = {
    address: wallet.address,

    async signTransaction(transaction: any) {
      const tx = transaction as {
        messageBytes: Uint8Array;
        signatures: Record<string, Uint8Array | null>;
      };

      const { VersionedTransaction: VTx, VersionedMessage } = await import('@solana/web3.js');
      const message = VersionedMessage.deserialize(tx.messageBytes);
      const vtx = new VTx(message);
      const signed = await wallet.signTransaction(vtx);

      const signerIndex = message.staticAccountKeys.findIndex(
        (key) => key.toBase58() === wallet.address
      );
      if (signerIndex >= 0 && signed.signatures[signerIndex]) {
        tx.signatures[wallet.address] = signed.signatures[signerIndex];
      }

      return tx;
    },

    async signTransactions(transactions: readonly any[]) {
      const results = [];
      for (const tx of transactions) {
        results.push(await signer.signTransaction(tx));
      }
      return results;
    },

    async signMessage(message: Uint8Array) {
      if (!wallet.signMessage) {
        throw new Error('Wallet does not support message signing.');
      }
      const signature = await wallet.signMessage(message);
      return { message, signature, signer: wallet.address };
    },
  };
  return signer;
}

// ── Service Class ──────────────────────────────────────────────────

export class UmbraService {
  private client: any = null;
  private config: UmbraServiceConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: UmbraServiceConfig) {
    this.config = config;
  }

  get isConfigured(): boolean {
    return Boolean(this.config.indexerUrl && this.config.rpcUrl && this.config.wssUrl);
  }

  /** Lazy-init the Umbra client. Must be called with a wallet signer. */
  async init(walletSigner: WalletAdapterSigner): Promise<void> {
    if (this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const { getUmbraClient } = await import('@umbra-privacy/sdk');
      this.client = await (getUmbraClient as any)({
        signer: createUmbraSigner(walletSigner),
        network: this.config.network,
        rpcUrl: this.config.rpcUrl,
        rpcSubscriptionsUrl: this.config.wssUrl,
        indexerApiEndpoint: this.config.indexerUrl,
        deferMasterSeedSignature: true,
      });
    })();

    return this.initPromise;
  }

  /** Register the user for confidential balances (idempotent). */
  async register(): Promise<void> {
    this.assertInit();
    const { getUserRegistrationFunction } = await import('@umbra-privacy/sdk');
    const register = (getUserRegistrationFunction as any)({ client: this.client });
    await register({ confidential: true, anonymous: false });
  }

  /** Shield tokens: public wallet → encrypted on-chain balance. */
  async shield(destinationAddress: string, mint: string, amount: bigint): Promise<void> {
    this.assertInit();
    const { getPublicBalanceToEncryptedBalanceDirectDepositorFunction } = await import('@umbra-privacy/sdk');
    const deposit = (getPublicBalanceToEncryptedBalanceDirectDepositorFunction as any)({ client: this.client });
    await deposit(destinationAddress, mint, amount);
  }

  /** Unshield tokens: encrypted on-chain balance → public wallet. */
  async unshield(destinationAddress: string, mint: string, amount: bigint): Promise<void> {
    this.assertInit();
    const { getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction } = await import('@umbra-privacy/sdk');
    const withdraw = (getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction as any)({ client: this.client });
    await withdraw(destinationAddress, mint, amount);
  }

  /** Query encrypted balances for given token mints. */
  async queryBalances(mints: string[]): Promise<EncryptedBalance[]> {
    this.assertInit();
    const { getEncryptedBalanceQuerierFunction } = await import('@umbra-privacy/sdk');
    const query = (getEncryptedBalanceQuerierFunction as any)({ client: this.client });
    const result: Map<string, any> = await query(mints);
    const balances: EncryptedBalance[] = [];
    for (const [mint, data] of result.entries()) {
      const amount: bigint = typeof data === 'bigint'
        ? data
        : data?.balance ?? BigInt(0);
      balances.push({ mint, amount });
    }
    return balances;
  }

  /** Issue a compliance viewing grant. */
  async issueComplianceGrant(...args: unknown[]): Promise<void> {
    this.assertInit();
    const { getComplianceGrantIssuerFunction } = await import('@umbra-privacy/sdk');
    const issue = (getComplianceGrantIssuerFunction as any)({ client: this.client });
    await issue(...args);
  }

  /** Revoke a compliance viewing grant. */
  async revokeComplianceGrant(...args: unknown[]): Promise<void> {
    this.assertInit();
    const { getComplianceGrantRevokerFunction } = await import('@umbra-privacy/sdk');
    const revoke = (getComplianceGrantRevokerFunction as any)({ client: this.client });
    await revoke(...args);
  }

  /** Recover SOL stuck from a failed MPC callback. */
  async recoverStagedSol(mint: string, amount: bigint, destination: string): Promise<void> {
    this.assertInit();
    const { getStagedSolRecovererFunction } = await import('@umbra-privacy/sdk');
    const recover = (getStagedSolRecovererFunction as any)({ client: this.client });
    await recover(mint, amount, destination);
  }

  /** Recover SPL tokens stuck from a failed MPC callback. */
  async recoverStagedSpl(mint: string, amount: bigint, destination: string): Promise<void> {
    this.assertInit();
    const { getStagedSplRecovererFunction } = await import('@umbra-privacy/sdk');
    const recover = (getStagedSplRecovererFunction as any)({ client: this.client });
    await recover(mint, amount, destination);
  }

  private assertInit(): void {
    if (!this.client) throw new Error('UmbraService not initialized. Call init() first.');
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
