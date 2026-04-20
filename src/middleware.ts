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

  // --- Origin check: block requests from unknown origins ---
  const origin = request.headers.get('origin')?.toLowerCase();
  const referer = request.headers.get('referer')?.toLowerCase();
  const host = request.headers.get('host')?.toLowerCase();

  // Same-origin: the frontend calling its own /api/* route is never CSRF.
  // This covers apex + www + stagev.vercel.app + preview URLs + custom
  // domains without per-deployment env updates.
  const isSameOrigin = Boolean(
    host &&
      ((origin && new URL(origin).host === host) ||
        (referer && new URL(referer).host === host))
  );

  const isServerSide = !origin && !referer;
  const originAllowed = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  const refererAllowed = referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  if (!isServerSide && !isSameOrigin && !originAllowed && !refererAllowed) {
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

  // --- CORS headers for allowed origins ---
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
