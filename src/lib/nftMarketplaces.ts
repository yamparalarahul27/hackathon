/**
 * NFT Marketplace URL builders — no API calls, just link construction.
 */

export function magicEdenUrl(mint: string): string {
  return `https://magiceden.io/item-details/${mint}`;
}

export function tensorUrl(mint: string): string {
  return `https://www.tensor.trade/item/${mint}`;
}

export function solscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${mint}`;
}

export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

export interface MarketplaceLink {
  label: string;
  url: string;
}

export function nftMarketplaceLinks(mint: string): MarketplaceLink[] {
  return [
    { label: 'Magic Eden', url: magicEdenUrl(mint) },
    { label: 'Tensor', url: tensorUrl(mint) },
    { label: 'Solscan', url: solscanTokenUrl(mint) },
  ];
}
