import { NextRequest, NextResponse } from 'next/server';

// Vercel sets VERCEL_URL on every deployment (e.g. "stagev.vercel.app" on stage,
// or the preview-specific hash on PR previews). Auto-allowing it means stage +
// preview deploys work without a manual ALLOWED_ORIGINS update per URL.
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

const ALLOWED_ORIGINS = [
  ...(process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  ...(vercelOrigin ? [vercelOrigin] : []),
]
  .map((o) => o.trim().toLowerCase())
  .filter(Boolean);

const API_RATE_LIMIT = 60;
const API_RATE_WINDOW_MS = 60_000;
const apiHits = new Map<string, { count: number; resetAt: number }>();

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();

  const method = request.method.toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

  // --- Origin check: only for mutating requests ---
  // GET /api/* is public, read-only, no cookies/auth → no CSRF surface.
  // Mutations (POST/PUT/DELETE/PATCH) must come from an allowed or same
  // origin to prevent browser-side CSRF from other sites.
  const origin = request.headers.get('origin')?.toLowerCase();
  const referer = request.headers.get('referer')?.toLowerCase();
  const host = request.headers.get('host')?.toLowerCase();

  const isSameOrigin = Boolean(
    host &&
      ((origin && safeUrlHost(origin) === host) ||
        (referer && safeUrlHost(referer) === host))
  );

  const isServerSide = !origin && !referer;
  const originAllowed = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  const refererAllowed = referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o));
  const originOk = isServerSide || isSameOrigin || originAllowed || refererAllowed;

  if (isMutation && !originOk) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: { 'X-Deny-Reason': 'origin_not_allowed' } }
    );
  }

  // --- Rate limit per IP ---
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();

  let entry = apiHits.get(ip);
  if (!entry || now > entry.resetAt) {
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

function safeUrlHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
