/**
 * Helius NFT Service
 *
 * Uses Helius DAS (Digital Asset Standard) API to fetch NFT holdings.
 * Free with existing Helius RPC key — no additional signup needed.
 *
 * Methods used: getAssetsByOwner, getAssets (batched), getAsset (single)
 */

export interface NftCreator {
  address: string;
  share: number;
  verified: boolean;
}

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

export interface NftCollectionRef {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

export interface NftCompressionInfo {
  tree: string | null;
  leafId: number | null;
  seq: number | null;
  dataHash: string | null;
  creatorHash: string | null;
  assetHash: string | null;
}

export interface NftSupplyInfo {
  printCurrent: number | null;
  printMax: number | null;
  editionNonce: number | null;
}

export interface NftAsset {
  id: string;
  name: string;
  symbol: string;
  description: string | null;
  image: string;
  animationUrl: string | null;
  externalUrl: string | null;
  jsonUri: string | null;
  attributes: NftAttribute[];
  collection: NftCollectionRef | null;
  // Legacy flat fields for backwards compatibility with existing components
  collectionId: string | null;
  creators: NftCreator[];
  royaltyBps: number;
  royaltyModel: string | null;
  primarySaleHappened: boolean;
  owner: string | null;
  frozen: boolean;
  delegated: boolean;
  delegate: string | null;
  ownershipModel: string | null;
  authorities: string[];
  supply: NftSupplyInfo | null;
  mutable: boolean;
  burnt: boolean;
  interface: string;
  compressed: boolean;
  compression: NftCompressionInfo | null;
}

interface DasAssetItem {
  interface: string;
  id: string;
  content?: {
    json_uri?: string;
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      attributes?: Array<{ trait_type?: string; value?: string | number }>;
    };
    links?: {
      image?: string;
      animation_url?: string;
      external_url?: string;
    };
  };
  authorities?: Array<{ address?: string; scopes?: string[] }>;
  compression?: {
    compressed?: boolean;
    tree?: string;
    leaf_id?: number;
    seq?: number;
    data_hash?: string;
    creator_hash?: string;
    asset_hash?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  royalty?: {
    royalty_model?: string;
    basis_points?: number;
    primary_sale_happened?: boolean;
    locked?: boolean;
  };
  creators?: Array<{ address?: string; share?: number; verified?: boolean }>;
  ownership?: {
    frozen?: boolean;
    delegated?: boolean;
    delegate?: string | null;
    ownership_model?: string;
    owner?: string;
  };
  supply?: {
    print_max_supply?: number | null;
    print_current_supply?: number | null;
    edition_nonce?: number | null;
  } | null;
  mutable?: boolean;
  burnt?: boolean;
}

interface DasByOwnerResponse {
  result?: {
    total: number;
    limit: number;
    page: number;
    items: DasAssetItem[];
  };
}

interface DasGetAssetsResponse {
  result?: DasAssetItem[];
}

interface DasGetAssetResponse {
  result?: DasAssetItem;
}

/** Map a raw DAS item to our richer NftAsset shape. */
function parseDasItem(item: DasAssetItem): NftAsset {
  const meta = item.content?.metadata ?? {};
  const links = item.content?.links ?? {};
  const collection = item.grouping?.find((g) => g.group_key === 'collection');

  const attributes: NftAttribute[] = Array.isArray(meta.attributes)
    ? meta.attributes
        .filter((a) => a && a.trait_type != null && a.value != null)
        .map((a) => ({ trait_type: String(a.trait_type), value: a.value as string | number }))
    : [];

  const creators: NftCreator[] = Array.isArray(item.creators)
    ? item.creators
        .filter((c) => c && c.address)
        .map((c) => ({
          address: String(c.address),
          share: Number(c.share ?? 0),
          verified: Boolean(c.verified),
        }))
    : [];

  const authorities: string[] = Array.isArray(item.authorities)
    ? item.authorities.filter((a) => a && a.address).map((a) => String(a.address))
    : [];

  const supply: NftSupplyInfo | null = item.supply
    ? {
        printCurrent: item.supply.print_current_supply ?? null,
        printMax: item.supply.print_max_supply ?? null,
        editionNonce: item.supply.edition_nonce ?? null,
      }
    : null;

  const isCompressed = item.compression?.compressed ?? false;
  const compression: NftCompressionInfo | null = item.compression
    ? {
        tree: item.compression.tree ?? null,
        leafId: item.compression.leaf_id ?? null,
        seq: item.compression.seq ?? null,
        dataHash: item.compression.data_hash ?? null,
        creatorHash: item.compression.creator_hash ?? null,
        assetHash: item.compression.asset_hash ?? null,
      }
    : null;

  return {
    id: item.id,
    name: meta.name ?? 'Unknown NFT',
    symbol: meta.symbol ?? '',
    description: meta.description ?? null,
    image: links.image ?? '',
    animationUrl: links.animation_url ?? null,
    externalUrl: links.external_url ?? null,
    jsonUri: item.content?.json_uri ?? null,
    attributes,
    collection: collection
      ? { id: collection.group_value, name: null, imageUrl: null }
      : null,
    collectionId: collection?.group_value ?? null,
    creators,
    royaltyBps: item.royalty?.basis_points ?? 0,
    royaltyModel: item.royalty?.royalty_model ?? null,
    primarySaleHappened: item.royalty?.primary_sale_happened ?? false,
    owner: item.ownership?.owner ?? null,
    frozen: item.ownership?.frozen ?? false,
    delegated: item.ownership?.delegated ?? false,
    delegate: item.ownership?.delegate ?? null,
    ownershipModel: item.ownership?.ownership_model ?? null,
    authorities,
    supply,
    mutable: item.mutable ?? true,
    burnt: item.burnt ?? false,
    interface: item.interface,
    compressed: isCompressed,
    compression,
  };
}

async function dasRpc<T>(rpcUrl: string, method: string, params: unknown): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Helius DAS ${res.status}`);
  return (await res.json()) as T;
}

const PAGE_LIMIT = 100;
const MAX_PAGES = 10; // 10 × 100 = 1000 NFT cap per wallet

/**
 * Fetch all NFTs owned by a wallet (paginated internally up to MAX_PAGES × PAGE_LIMIT).
 */
export async function fetchNftsByOwner(
  walletAddress: string,
  rpcUrl: string
): Promise<{ total: number; nfts: NftAsset[] }> {
  const allItems: DasAssetItem[] = [];
  let page = 1;
  let total = 0;

  while (page <= MAX_PAGES) {
    const body = await dasRpc<DasByOwnerResponse>(rpcUrl, 'getAssetsByOwner', {
      ownerAddress: walletAddress,
      page,
      limit: PAGE_LIMIT,
      displayOptions: { showFungible: false, showNativeBalance: false },
    });

    if (!body.result) throw new Error('Invalid DAS response');

    total = body.result.total;
    allItems.push(...body.result.items);

    if (body.result.items.length < PAGE_LIMIT) break;
    page += 1;
  }

  const nfts = allItems.map(parseDasItem);

  // Resolve collection names by batched getAssets on unique collection mints.
  const uniqueCollectionMints = Array.from(
    new Set(nfts.map((n) => n.collection?.id).filter((id): id is string => Boolean(id)))
  );

  if (uniqueCollectionMints.length > 0) {
    try {
      const collectionMap = await fetchCollectionMetadata(uniqueCollectionMints, rpcUrl);
      for (const nft of nfts) {
        if (nft.collection && collectionMap.has(nft.collection.id)) {
          const info = collectionMap.get(nft.collection.id)!;
          nft.collection = { ...nft.collection, ...info };
        }
      }
    } catch {
      // Collection name resolution is best-effort — don't fail the whole request.
    }
  }

  return { total, nfts };
}

/**
 * Fetch metadata for a list of collection mints via batched getAssets.
 * Returns a map of mint -> { name, imageUrl }.
 */
async function fetchCollectionMetadata(
  mints: string[],
  rpcUrl: string
): Promise<Map<string, { name: string | null; imageUrl: string | null }>> {
  const result = new Map<string, { name: string | null; imageUrl: string | null }>();
  if (mints.length === 0) return result;

  const body = await dasRpc<DasGetAssetsResponse>(rpcUrl, 'getAssets', { ids: mints });
  if (!body.result) return result;

  for (const item of body.result) {
    if (!item?.id) continue;
    const meta = item.content?.metadata ?? {};
    const links = item.content?.links ?? {};
    result.set(item.id, {
      name: meta.name ?? null,
      imageUrl: links.image ?? null,
    });
  }
  return result;
}

/**
 * Fetch a single NFT by its mint address (for detail view URL navigation).
 */
export async function fetchNftByMint(mint: string, rpcUrl: string): Promise<NftAsset | null> {
  const body = await dasRpc<DasGetAssetResponse>(rpcUrl, 'getAsset', { id: mint });
  if (!body.result) return null;

  const nft = parseDasItem(body.result);

  // Best-effort collection name resolution.
  if (nft.collection) {
    try {
      const collectionMap = await fetchCollectionMetadata([nft.collection.id], rpcUrl);
      const info = collectionMap.get(nft.collection.id);
      if (info) nft.collection = { ...nft.collection, ...info };
    } catch {
      // Ignore — fall back to mint address only.
    }
  }

  return nft;
}
