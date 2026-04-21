import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Jupiter API proxy.
 *
 * Forwards requests to https://api.jup.ag with an allow-list of paths.
 * The primary reason for proxying Jupiter is to attach `x-api-key`
 * server-side when `JUPITER_API_KEY` is set — on the client, non-public
 * env vars resolve to undefined, so a client-side key attach is a no-op.
 *
 * Keyless tier is 0.5 RPS (no key needed). If JUPITER_API_KEY is set,
 * we attach it and the upstream lifts to 1+ RPS (or more, depending on
 * plan) — see https://portal.jup.ag.
 *
 * Supported methods: GET + POST (Ultra /execute needs POST with body).
 */

const JUPITER_UPSTREAM = 'https://api.jup.ag';
const INTERNAL_API_SECRET_HEADER = 'x-internal-api-secret';
const EXECUTE_PATH = 'ultra/v1/execute';

// Allow-list of forwarded Jupiter paths. Prevents use as open relay.
// Match by prefix — query strings vary too much to enumerate exactly.
const ALLOWED_PREFIXES: readonly string[] = [
  'price/v3',              // USD price lookup
  'ultra/v1/order',        // swap quote
  'ultra/v1/execute',      // swap execution (POST)
  'ultra/v1/shield',       // scam warnings
  'ultra/v1/holdings',     // wallet holdings
  'ultra/v1/search',       // token search
  'tokens/v2/search',      // token list v2 search
  'tokens/v2/toptraded',   // ranked by volume
  'tokens/v2/toporganicscore',
  'tokens/v2/toptrending',
];

function pathAllowed(joined: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => joined === prefix || joined.startsWith(prefix + '/'));
}

function jupiterHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  const key = process.env.JUPITER_API_KEY;
  if (key) headers['x-api-key'] = key;
  return headers;
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function hasValidInternalBypass(request: NextRequest): boolean {
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (!expectedSecret) return false;

  const providedSecret = request.headers.get(INTERNAL_API_SECRET_HEADER);
  return Boolean(providedSecret && providedSecret === expectedSecret);
}

function isSameOriginBrowserRequest(request: NextRequest): boolean {
  const requestOrigin = request.nextUrl.origin.toLowerCase();
  const origin = normalizeOrigin(request.headers.get('origin'));
  const refererOrigin = normalizeOrigin(request.headers.get('referer'));
  return origin === requestOrigin || refererOrigin === requestOrigin;
}

function denyExecute(
  joinedPath: string,
  status: 401 | 403,
  code: 'internal_auth_required' | 'invalid_internal_auth' | 'same_origin_required'
): NextResponse {
  return NextResponse.json(
    {
      error: status === 401 ? 'Unauthorized' : 'Forbidden',
      code,
      path: joinedPath,
    },
    {
      status,
      headers: { 'X-Deny-Reason': code },
    }
  );
}

function canRunExecutePost(request: NextRequest, joinedPath: string): NextResponse | null {
  const isExecutePost = request.method === 'POST' &&
    (joinedPath === EXECUTE_PATH || joinedPath.startsWith(`${EXECUTE_PATH}/`));
  if (!isExecutePost) return null;

  if (isSameOriginBrowserRequest(request) || hasValidInternalBypass(request)) {
    return null;
  }

  const hasOriginOrReferer = Boolean(
    normalizeOrigin(request.headers.get('origin')) ||
      normalizeOrigin(request.headers.get('referer'))
  );
  const providedSecret = request.headers.get(INTERNAL_API_SECRET_HEADER);

  if (providedSecret) {
    return denyExecute(joinedPath, 401, 'invalid_internal_auth');
  }
  if (!hasOriginOrReferer) {
    return denyExecute(joinedPath, 401, 'internal_auth_required');
  }
  return denyExecute(joinedPath, 403, 'same_origin_required');
}

async function proxy(request: NextRequest, joinedPath: string): Promise<NextResponse> {
  if (!pathAllowed(joinedPath)) {
    return NextResponse.json({ error: 'Path not allowed', path: joinedPath }, { status: 404 });
  }

  const executePolicyDenial = canRunExecutePost(request, joinedPath);
  if (executePolicyDenial) return executePolicyDenial;

  const query = request.nextUrl.searchParams.toString();
  const upstreamUrl = `${JUPITER_UPSTREAM}/${joinedPath}${query ? `?${query}` : ''}`;

  try {
    const upstreamInit: RequestInit = {
      method: request.method,
      headers: jupiterHeaders(
        request.method !== 'GET' && request.headers.get('content-type')
          ? { 'Content-Type': request.headers.get('content-type')! }
          : {}
      ),
      signal: AbortSignal.timeout(12_000),
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Pass the raw body through. Jupiter swap execute expects the
      // exact bytes we received — don't parse/re-stringify.
      upstreamInit.body = await request.text();
    }

    const upstream = await fetch(upstreamUrl, upstreamInit);
    const body = await upstream.text();

    if (!upstream.ok) {
      console.warn('[api/jupiter] upstream non-OK', joinedPath, upstream.status, body.slice(0, 300));
      return NextResponse.json(
        {
          error: 'Jupiter upstream returned non-OK status.',
          upstreamStatus: upstream.status,
          upstreamBodyPreview: body.slice(0, 300),
          path: joinedPath,
        },
        {
          status: upstream.status,
          headers: { 'X-Jupiter-Upstream-Status': String(upstream.status) },
        }
      );
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'X-Jupiter-Upstream-Status': String(upstream.status),
      },
    });
  } catch (err) {
    console.error('[api/jupiter] upstream failed', joinedPath, err);
    return NextResponse.json(
      { error: 'Jupiter upstream request failed.', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path.join('/'));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path.join('/'));
}
