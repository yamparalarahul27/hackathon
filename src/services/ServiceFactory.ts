/**
 * Service Factory
 *
 * Centralized factory that returns real or mock service instances
 * based on the current network mode. Ensures the entire app can
 * run in demo mode (devnet/mock) with zero API keys or external deps.
 *
 * Usage:
 *   const services = createServices('mock');
 *   const quote = await services.swap.getQuote({ ... });
 *   const result = await services.deposit.deposit({ ... });
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

// ── Factory ────────────────────────────────────────────────────

export function createServices(network: NetworkMode = 'mock'): ServiceInstances {
  const isLive = network === 'mainnet';

  if (isLive) {
    return {
      swap: new JupiterSwapService(),
      deposit: new KaminoDepositService(HELIUS_RPC_URL),
      network,
      isLive: true,
    };
  }

  // Devnet and mock both use mock services
  // Jupiter doesn't support devnet, Kamino is mainnet-only
  return {
    swap: new MockJupiterSwapService(),
    deposit: new MockKaminoDepositService(),
    network,
    isLive: false,
  };
}

// ── Singleton for client components ────────────────────────────

let _services: ServiceInstances | null = null;

export function getServices(network?: NetworkMode): ServiceInstances {
  if (!_services || (network && _services.network !== network)) {
    _services = createServices(network ?? 'mock');
  }
  return _services;
}
