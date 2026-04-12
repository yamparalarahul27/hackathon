/**
 * Service Factory
 *
 * Centralized factory that returns real or mock service instances
 * based on the RPC configuration. If a mainnet Helius RPC URL is
 * configured, real services are used. Otherwise falls back to mock.
 */

import { JupiterSwapService, MockJupiterSwapService } from './JupiterSwapService';
import { KaminoDepositService, MockKaminoDepositService } from './KaminoDepositService';
import { HELIUS_RPC_URL } from '../lib/constants';

// ── Types ──────────────────────────────────────────────────────

export type NetworkMode = 'mainnet' | 'devnet' | 'mock';

export interface ServiceInstances {
  swap: JupiterSwapService | MockJupiterSwapService;
  deposit: KaminoDepositService | MockKaminoDepositService;
  network: NetworkMode;
  isLive: boolean;
}

// ── Detect network from RPC URL ────────────────────────────────

function detectNetwork(): NetworkMode {
  if (!HELIUS_RPC_URL) return 'mock';
  if (HELIUS_RPC_URL.includes('mainnet')) return 'mainnet';
  if (HELIUS_RPC_URL.includes('devnet')) return 'devnet';
  return 'mock';
}

// ── Factory ────────────────────────────────────────────────────

export function createServices(network?: NetworkMode): ServiceInstances {
  const mode = network ?? detectNetwork();
  const isLive = mode === 'mainnet';

  if (isLive) {
    return {
      swap: new JupiterSwapService(),
      deposit: new KaminoDepositService(HELIUS_RPC_URL),
      network: mode,
      isLive: true,
    };
  }

  return {
    swap: new MockJupiterSwapService(),
    deposit: new MockKaminoDepositService(),
    network: mode,
    isLive: false,
  };
}

// ── Singleton ──────────────────────────────────────────────────

let _services: ServiceInstances | null = null;

export function getServices(network?: NetworkMode): ServiceInstances {
  if (!_services || (network && _services.network !== network)) {
    _services = createServices(network);
  }
  return _services;
}
