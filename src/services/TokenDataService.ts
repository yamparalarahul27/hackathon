/**
 * Token Data Service
 *
 * Aggregates token data from multiple free APIs:
 * - Jupiter Price API (current price)
 * - CoinGecko (market data, historical charts)
 * - Binance (24h ticker, candlesticks)
 *
 * All endpoints are free, no API keys required.
 */

// ── Types ──────────────────────────────────────────────────────

export interface TokenMarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  fdv: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  rank: number;
}

export interface TokenPriceSource {
  source: string;
  price: number;
  updatedAt: Date;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  mint: string;
  decimals: number;
  logoUri: string;
  description: string;
}

// ── Known Tokens (mint → CoinGecko ID + Binance symbol) ───────

const TOKEN_MAP: Record<string, { geckoId: string; binanceSymbol: string; name: string; symbol: string; decimals: number; description: string }> = {
  'So11111111111111111111111111111111111111112': {
    geckoId: 'solana', binanceSymbol: 'SOLUSDT', name: 'Solana', symbol: 'SOL', decimals: 9,
    description: 'A high-performance Layer 1 blockchain designed for mass adoption with sub-second finality and sub-penny transaction costs.',
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    geckoId: 'usd-coin', binanceSymbol: 'USDCUSDT', name: 'USD Coin', symbol: 'USDC', decimals: 6,
    description: 'A fully-reserved stablecoin pegged 1:1 to the US dollar, issued by Circle.',
  },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': {
    geckoId: 'ethereum', binanceSymbol: 'ETHUSDT', name: 'Ethereum', symbol: 'ETH', decimals: 8,
    description: 'A decentralized platform for smart contracts and dApps. This is the Wormhole-bridged version on Solana.',
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    geckoId: 'jupiter-exchange-solana', binanceSymbol: 'JUPUSDT', name: 'Jupiter', symbol: 'JUP', decimals: 6,
    description: 'The leading DEX aggregator on Solana, providing best-price swap routing across all Solana liquidity.',
  },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': {
    geckoId: 'jito-governance-token', binanceSymbol: 'JTOUSDT', name: 'Jito', symbol: 'JTO', decimals: 9,
    description: 'Governance token for Jito, the leading MEV protocol and liquid staking solution on Solana.',
  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    geckoId: 'bonk', binanceSymbol: 'BONKUSDT', name: 'Bonk', symbol: 'BONK', decimals: 5,
    description: 'The first Solana dog coin, community-driven memecoin airdropped to Solana ecosystem participants.',
  },
};

// ── Fetch Functions ────────────────────────────────────────────

export function getTokenMetadata(mint: string): TokenMetadata | null {
  const info = TOKEN_MAP[mint];
  if (!info) return null;
  return {
    name: info.name,
    symbol: info.symbol,
    mint,
    decimals: info.decimals,
    logoUri: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
    description: info.description,
  };
}

export async function fetchJupiterPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`);
    const data = await res.json();
    return data.data?.[mint]?.price ? parseFloat(data.data[mint].price) : null;
  } catch { return null; }
}

export async function fetchCoinGeckoMarketData(mint: string): Promise<TokenMarketData | null> {
  const info = TOKEN_MAP[mint];
  if (!info) return null;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${info.geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      price: data.market_data?.current_price?.usd ?? 0,
      change24h: data.market_data?.price_change_percentage_24h ?? 0,
      volume24h: data.market_data?.total_volume?.usd ?? 0,
      marketCap: data.market_data?.market_cap?.usd ?? 0,
      fdv: data.market_data?.fully_diluted_valuation?.usd ?? 0,
      high24h: data.market_data?.high_24h?.usd ?? 0,
      low24h: data.market_data?.low_24h?.usd ?? 0,
      circulatingSupply: data.market_data?.circulating_supply ?? 0,
      rank: data.market_cap_rank ?? 0,
    };
  } catch { return null; }
}

export async function fetchBinancePrice(mint: string): Promise<number | null> {
  const info = TOKEN_MAP[mint];
  if (!info) return null;
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${info.binanceSymbol}`);
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.price);
  } catch { return null; }
}

export async function fetchAllPriceSources(mint: string): Promise<TokenPriceSource[]> {
  const sources: TokenPriceSource[] = [];
  const now = new Date();

  const [jupPrice, geckoData, binancePrice] = await Promise.all([
    fetchJupiterPrice(mint),
    fetchCoinGeckoMarketData(mint),
    fetchBinancePrice(mint),
  ]);

  if (jupPrice) sources.push({ source: 'Jupiter', price: jupPrice, updatedAt: now });
  if (geckoData) sources.push({ source: 'CoinGecko', price: geckoData.price, updatedAt: now });
  if (binancePrice) sources.push({ source: 'Binance', price: binancePrice, updatedAt: now });

  return sources;
}

/** Check if a mint is a known/supported token */
export function isKnownToken(mint: string): boolean {
  return mint in TOKEN_MAP;
}

/** Get symbol from mint */
export function getSymbolFromMint(mint: string): string {
  return TOKEN_MAP[mint]?.symbol ?? mint.slice(0, 6);
}
