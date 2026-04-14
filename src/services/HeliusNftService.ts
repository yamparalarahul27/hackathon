/**
 * Helius NFT Service
 *
 * Uses Helius DAS (Digital Asset Standard) API to fetch NFT holdings.
 * Free with existing Helius RPC key — no additional signup needed.
 *
 * Method: getAssetsByOwner (JSON-RPC on the Helius RPC endpoint)
 */

export interface NftAsset {
  id: string;
  name: string;
  symbol: string;
  image: string;
  collection: string | null;
  collectionId: string | null;
  interface: string; // V1_NFT, ProgrammableNFT, etc.
  compressed: boolean;
}

interface DasResponse {
  result?: {
    total: number;
    items: Array<{
      interface: string;
      id: string;
      content?: {
        metadata?: { name?: string; symbol?: string };
        links?: { image?: string };
      };
      grouping?: Array<{ group_key: string; group_value: string }>;
      compression?: { compressed?: boolean };
    }>;
  };
}

/**
 * Fetch NFTs owned by a wallet address.
 */
export async function fetchNftsByOwner(
  walletAddress: string,
  rpcUrl: string,
  page = 1,
  limit = 50
): Promise<{ total: number; nfts: NftAsset[] }> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        page,
        limit,
        displayOptions: {
          showFungible: false,
          showNativeBalance: false,
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Helius DAS ${res.status}`);
  const body: DasResponse = await res.json();

  if (!body.result) throw new Error('Invalid DAS response');

  const nfts: NftAsset[] = body.result.items.map((item) => {
    const meta = item.content?.metadata ?? {};
    const links = item.content?.links ?? {};
    const collection = item.grouping?.find((g) => g.group_key === 'collection');

    return {
      id: item.id,
      name: meta.name ?? 'Unknown NFT',
      symbol: meta.symbol ?? '',
      image: links.image ?? '',
      collection: collection ? collection.group_value : null,
      collectionId: collection?.group_value ?? null,
      interface: item.interface,
      compressed: item.compression?.compressed ?? false,
    };
  });

  return { total: body.result.total, nfts };
}
