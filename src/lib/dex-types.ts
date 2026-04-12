/**
 * DEX Trade Types
 *
 * Protocol-agnostic types for DEX trade data.
 * Works with Deriverse, Jupiter, Raydium, or any future DEX.
 */

export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market';

export interface DexTrade {
  id: string;
  symbol: string;
  quoteCurrency: string;
  side: 'buy' | 'sell' | 'long' | 'short';
  orderType: OrderType;
  quantity: number;
  price: number;
  notional: number;
  pnl: number;
  fee: number;
  feeCurrency: string;
  openedAt: Date;
  closedAt: Date;
  durationSeconds: number;
  isWin: boolean;
  txSignature: string;
  isMaker?: boolean;
  leverage?: number;
}

export type FilterType = 'All' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'This Year';
