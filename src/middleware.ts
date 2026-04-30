import { NextRequest, NextResponse } from 'next/server';

// Vercel sets VERCEL_URL on every deployment (e.g. "stagev.vercel.app" on stage,
// or the preview-specific hash on PR previews). Auto-allowing it means stage +
// preview deploys work without a manual ALLOWED_ORIGINS update per URL.
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const INTERNAL_API_SECRET_HEADER = 'x-internal-api-secret';

const ALLOWED_ORIGINS = [
  ...(process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  ...(vercelOrigin ? [vercelOrigin] : []),
]
  .map((o) => normalizeOrigin(o.trim()))
  .filter((o): o is string => Boolean(o));
const ALLOWED_ORIGIN_SET = new Set(ALLOWED_ORIGINS);

const API_RATE_LIMIT = 60;
const API_RATE_WINDOW_MS = 60_000;
// Cap entries to prevent unbounded growth (memory leak / DoS via IP rotation).
const API_HITS_MAX_ENTRIES = 5_000;
const apiHits = new Map<string, { count: number; resetAt: number }>();

function evictApiHitsIfFull(): void {
  if (apiHits.size <= API_HITS_MAX_ENTRIES) return;
  const drop = Math.max(1, Math.floor(API_HITS_MAX_ENTRIES * 0.1));
  let i = 0;
  for (const k of apiHits.keys()) {
    apiHits.delete(k);
    if (++i >= drop) break;
  }
}

function clientIp(request: NextRequest): string {
  // Prefer Vercel-set headers (verified at the edge); fall back to the
  // first XFF entry if x-real-ip isn't present.
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return 'unknown';
}

function hasValidInternalBypass(request: NextRequest): boolean {
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (!expectedSecret) return false;

  const providedSecret = request.headers.get(INTERNAL_API_SECRET_HEADER);
  return Boolean(providedSecret && providedSecret === expectedSecret);
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function denyMutation(status: 401 | 403, denyReason: string): NextResponse {
  return NextResponse.json(
    {
      error: status === 401 ? 'Unauthorized' : 'Forbidden',
      code: denyReason,
    },
    { status, headers: { 'X-Deny-Reason': denyReason } }
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();

  const method = request.method.toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

  // --- Origin check: only for mutating requests ---
  // GET /api/* is public, read-only, no cookies/auth → no CSRF surface.
  // Mutations (POST/PUT/DELETE/PATCH) must come from an allowed/same
  // browser origin. Origin-less server-side calls require explicit
  // internal auth via x-internal-api-secret.
  const requestOrigin = request.nextUrl.origin.toLowerCase();
  const origin = normalizeOrigin(request.headers.get('origin'));
  const refererOrigin = normalizeOrigin(request.headers.get('referer'));
  const hasBrowserProvenance = Boolean(origin || refererOrigin);

  const isSameOrigin = origin === requestOrigin || refererOrigin === requestOrigin;
  const originAllowed = origin ? ALLOWED_ORIGIN_SET.has(origin) : false;
  const refererAllowed = refererOrigin ? ALLOWED_ORIGIN_SET.has(refererOrigin) : false;
  const internalBypassAllowed = !hasBrowserProvenance && hasValidInternalBypass(request);
  const originOk = isSameOrigin || originAllowed || refererAllowed || internalBypassAllowed;

  if (isMutation && !originOk) {
    if (!hasBrowserProvenance) {
      return denyMutation(401, 'internal_auth_required');
    }
    return denyMutation(403, 'origin_not_allowed');
  }

  // --- Rate limit per IP ---
  const ip = clientIp(request);
  const now = Date.now();

  let entry = apiHits.get(ip);
  if (!entry || now > entry.resetAt) {
    evictApiHitsIfFull();
    entry = { count: 0, resetAt: now + API_RATE_WINDOW_MS };
    apiHits.set(ip, entry);
  }
  entry.count += 1;

  if (entry.count > API_RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limited' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // --- CORS headers ---
  const response = NextResponse.next();
  if (origin && (originAllowed || isSameOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
