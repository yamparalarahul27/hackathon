#!/usr/bin/env node
/**
 * Bundle Secret Leak Audit
 *
 * Fails with exit 1 if any server-only env var VALUE appears in the
 * client JS bundle (`.next/static/chunks/**`). Server-only = any env
 * var NOT prefixed with `NEXT_PUBLIC_`.
 *
 * Usage:
 *   node scripts/audit-bundle-secrets.mjs
 *
 * Assumptions:
 *   - `.next/` exists (run `npm run build` first).
 *   - Env vars with real values are loaded (from Vercel, .env.local, or
 *     the shell). Without values we can't check for leaks — we report
 *     which vars had no value to scan for, so the user can re-run with
 *     a populated env.
 *
 * Also names-only scan: flags occurrences of server-only env var NAMES
 * in client chunks. Names leaking is not a secret leak (Next.js does
 * not inline non-NEXT_PUBLIC_ values into client bundles) but it
 * reveals infra and points at dead code reading unreachable env vars.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CHUNKS_DIR = join(ROOT, '.next', 'static', 'chunks');
const ENV_EXAMPLE = join(ROOT, '.env.example');

// ── 0. Preconditions ──────────────────────────────────────────────

if (!existsSync(CHUNKS_DIR)) {
  console.error(`[bundle-audit] FAIL: ${CHUNKS_DIR} not found. Run \`npm run build\` first.`);
  process.exit(1);
}
if (!existsSync(ENV_EXAMPLE)) {
  console.error(`[bundle-audit] FAIL: ${ENV_EXAMPLE} not found.`);
  process.exit(1);
}

// ── 1. Enumerate server-only env var names from .env.example ──────

const serverOnlyNames = readFileSync(ENV_EXAMPLE, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('=')[0].trim())
  .filter((n) => n && !n.startsWith('NEXT_PUBLIC_'));

// Known server-only names not in .env.example but used in code.
const extra = ['TORQUE_API_KEY', 'TORQUE_API_TOKEN', 'TORQUE_API_URL', 'TORQUE_INGEST_URL'];
for (const n of extra) if (!serverOnlyNames.includes(n)) serverOnlyNames.push(n);

// ── 2. Load env values (from process.env — populated by CI or shell) ─

const nameValueScanList = [];
const missingValue = [];
for (const name of serverOnlyNames) {
  const value = process.env[name];
  if (value && value.length >= 12) {
    // Only scan for values that look like real secrets (>= 12 chars).
    // Anything shorter is likely a placeholder, flag, or empty.
    nameValueScanList.push({ name, value });
  } else {
    missingValue.push(name);
  }
}

// ── 3. Walk chunks ────────────────────────────────────────────────

function* walkJsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walkJsFiles(full);
    } else if (entry.endsWith('.js')) {
      yield full;
    }
  }
}

const chunkFiles = [...walkJsFiles(CHUNKS_DIR)];
let totalBytes = 0;
const valueHits = [];
const nameHits = [];

for (const file of chunkFiles) {
  const body = readFileSync(file, 'utf8');
  totalBytes += body.length;
  for (const { name, value } of nameValueScanList) {
    if (body.includes(value)) {
      valueHits.push({ file, name });
    }
  }
  for (const name of serverOnlyNames) {
    if (body.includes(name)) {
      nameHits.push({ file, name });
    }
  }
}

// ── 4. Report ─────────────────────────────────────────────────────

console.log(`[bundle-audit] Scanned ${chunkFiles.length} chunks (${(totalBytes / 1024).toFixed(0)} KiB)`);
console.log(`[bundle-audit] Server-only env vars considered: ${serverOnlyNames.length}`);

if (missingValue.length > 0) {
  console.log(
    `[bundle-audit] NOTE: ${missingValue.length} var(s) had no value in this env, so their values weren't scanned for: ${missingValue.join(', ')}`
  );
}

if (nameHits.length > 0) {
  console.log('[bundle-audit] Name references in client bundle (info-only — not secrets):');
  const byName = new Map();
  for (const { name, file } of nameHits) {
    if (!byName.has(name)) byName.set(name, new Set());
    byName.get(name).add(file.replace(ROOT + '/', ''));
  }
  for (const [name, files] of byName) {
    console.log(`  - ${name}: ${files.size} file(s)`);
  }
}

if (valueHits.length > 0) {
  console.error('\n[bundle-audit] FAIL: secret VALUES leaked into client bundle:');
  for (const { file, name } of valueHits) {
    console.error(`  - ${name} value found in ${file.replace(ROOT + '/', '')}`);
  }
  console.error(
    '\n[bundle-audit] Fix: move the consumer to a server-only path, or wrap the file with `import "server-only"`.'
  );
  process.exit(1);
}

console.log('[bundle-audit] PASS — no server-only env values detected in client bundles.');
