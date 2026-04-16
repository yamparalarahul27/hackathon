/**
 * Kamino REST API Client
 *
 * Thin typed wrapper over Kamino's documented REST API at api.kamino.finance.
 * Only covers endpoints currently listed in their developer docs
 * (kamino.com/docs). No SDKs.
 *
 * Data API:     https://api.kamino.finance (OpenAPI: /openapi/json)
 * Transactions: https://api.kamino.finance/ktx (OpenAPI: /ktx/documentation/json)
 */

const BASE_URL = 'https://api.kamino.finance';
const ENV = 'mainnet-beta';
const DEFAULT_TIMEOUT_MS = 8000;

// ── Raw API response shapes ───────────────────────────────────────

/** Single item from GET /kvaults/vaults */
export interface KVaultRawState {
  address: string;
  programId: string;
  state: {
    tokenMint: string;
    tokenMintDecimals: number;
    sharesMint: string;
    sharesMintDecimals: number;
    name: string;
    performanceFeeBps: number;
    managementFeeBps: number;
    tokenAvailable: string;
    sharesIssued: string;
    prevAum: string;
    vaultFarm?: string;
    vaultAdminAuthority?: string;
    creationTimestamp?: number;
  };
}

/** Response from GET /kvaults/{addr}/metrics */
export interface KVaultMetrics {
  apy: string;
  apy7d: string;
  apy24h: string;
  apy30d: string;
  apy90d: string;
  apy180d: string;
  apy365d: string;
  apyFarmRewards: string;
  apyIncentives: string;
  apyReservesIncentives: string;
  apyTheoretical: string;
  apyActual: string;
  tokenPrice: string;
  solPrice: string;
  tokensAvailable: string;
  tokensAvailableUsd: string;
  tokensInvested: string;
  tokensInvestedUsd: string;
  sharePrice: string;
  tokensPerShare: string;
  sharesIssued: string;
  numberOfHolders: number;
  cumulativeInterestEarned: string;
  cumulativeInterestEarnedUsd: string;
  interestEarnedPerSecond: string;
  cumulativePerformanceFees: string;
  cumulativeManagementFees: string;
}

/** Single item from GET /kvaults/users/{pubkey}/positions */
export interface KVaultUserPosition {
  vaultAddress: string;
  stakedShares: string;
  unstakedShares: string;
  totalShares: string;
  // The response also includes the full vault state merged in (allOf),
  // but we only use shares; other fields are fetched via listVaults.
  state?: KVaultRawState['state'];
}

/** Response from POST /ktx/kvault/deposit */
export interface KVaultDepositTxResponse {
  transaction: string; // base64-encoded serialized VersionedTransaction
}

/** Response from POST /ktx/kvault/withdraw */
export interface KVaultWithdrawTxResponse {
  transaction: string; // base64-encoded serialized VersionedTransaction
}

// ── Client ────────────────────────────────────────────────────────

export class KaminoApiClient {
  private fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path}`;
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: {
        'Accept': 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Kamino API ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json() as Promise<T>;
    });
  }

  /** GET /kvaults/vaults — list every K-Vault. */
  listVaults(): Promise<KVaultRawState[]> {
    return this.fetchJson<KVaultRawState[]>(`/kvaults/vaults?env=${ENV}`);
  }

  /** GET /kvaults/{addr}/metrics — APY, TVL, share price, holders. */
  async getVaultMetrics(vaultAddress: string): Promise<KVaultMetrics | null> {
    try {
      return await this.fetchJson<KVaultMetrics>(
        `/kvaults/${vaultAddress}/metrics?env=${ENV}`
      );
    } catch {
      return null;
    }
  }

  /** GET /kvaults/users/{pubkey}/positions — user's K-Vault deposits. */
  getUserPositions(walletAddress: string): Promise<KVaultUserPosition[]> {
    return this.fetchJson<KVaultUserPosition[]>(
      `/kvaults/users/${walletAddress}/positions?env=${ENV}`
    );
  }

  /**
   * POST /ktx/kvault/deposit — Kamino returns a base64-encoded transaction.
   * Caller decodes, signs with the user's wallet, and sends via RPC.
   */
  buildDepositTx(params: {
    wallet: string;
    kvault: string;
    amount: string; // decimal string, NOT lamports
  }): Promise<KVaultDepositTxResponse> {
    return this.fetchJson<KVaultDepositTxResponse>('/ktx/kvault/deposit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * POST /ktx/kvault/withdraw — Kamino returns a base64-encoded transaction.
   * Caller decodes, signs with the user's wallet, and sends via RPC.
   * `amount` is the number of shares to redeem (decimal string).
   */
  buildWithdrawTx(params: {
    wallet: string;
    kvault: string;
    amount: string; // shares as decimal string
  }): Promise<KVaultWithdrawTxResponse> {
    return this.fetchJson<KVaultWithdrawTxResponse>('/ktx/kvault/withdraw', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
