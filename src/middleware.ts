// Clerk middleware disabled — no route guards or session state.
// Re-enable by uncommenting the imports + default export below.
//
// import { clerkMiddleware } from '@clerk/nextjs/server';
// export default clerkMiddleware();

// With no middleware needed, matcher below matches nothing so Next.js
// effectively skips this file at runtime. Keeping the stub so re-enabling
// is a one-line change.
export const config = {
  matcher: [],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function noopMiddleware() {
  return undefined;
}
