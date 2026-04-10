/**
 * useServices Hook
 *
 * Provides access to the service layer (swap, deposit) with
 * automatic real/mock selection based on network mode.
 *
 * Usage:
 *   const { swap, deposit, isLive } = useServices('mock');
 *   const quote = await swap.getQuoteForUsdAmount(TOKEN_MINTS.SOL, 50);
 */

import { useMemo } from 'react';
import { createServices, type NetworkMode, type ServiceInstances } from '../../services/ServiceFactory';

export function useServices(network: NetworkMode = 'mock'): ServiceInstances {
  return useMemo(() => createServices(network), [network]);
}
