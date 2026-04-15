/**
 * Service Factory
 *
 * Centralized factory for the app's service instances. Deposits now hit
 * Kamino's documented REST API and are real across all networks —
 * there's no mock deposit path anymore.
 */

import { JupiterSwapService, MockJupiterSwapService } from './JupiterSwapService';
import { KaminoDepositService } from './KaminoDepositService';
import { HELIUS_RPC_URL } from '../lib/constants';

// ── Types ──────────────────────────────────────────────────────────

export type NetworkMode = 'mainnet' | 'devnet' | 'mock';

export interface ServiceInstances {
  swap: JupiterSwapService | MockJupiterSwapService;
  deposit: KaminoDepositService;
  network: NetworkMode;
  isLive: boolean;
}

// ── Detect network from RPC URL ────────────────────────────────────

function detectNetwork(): NetworkMode {
  if (!HELIUS_RPC_URL) return 'mock';
  if (HELIUS_RPC_URL.includes('mainnet')) return 'mainnet';
  if (HELIUS_RPC_URL.includes('devnet')) return 'devnet';
  return 'mock';
}

// ── Factory ────────────────────────────────────────────────────────

export function createServices(network?: NetworkMode): ServiceInstances {
  const mode = network ?? detectNetwork();
  const isLive = mode === 'mainnet';

  return {
    swap: isLive ? new JupiterSwapService() : new MockJupiterSwapService(),
    deposit: new KaminoDepositService(HELIUS_RPC_URL),
    network: mode,
    isLive,
  };
}

// ── Singleton ──────────────────────────────────────────────────────

let _services: ServiceInstances | null = null;

export function getServices(network?: NetworkMode): ServiceInstances {
  if (!_services || (network && _services.network !== network)) {
    _services = createServices(network);
  }
  return _services;
}
