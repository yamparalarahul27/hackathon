#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HIGH_SEVERITY = 3;
const severityRank = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const repoRoot = process.cwd();
const exceptionsPath = path.join(repoRoot, 'scripts', 'audit-exceptions.json');

const auditProc = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
});

if (auditProc.error) {
  console.error('[audit-gate] Failed to run npm audit:', auditProc.error.message);
  process.exit(1);
}

const auditRaw = (auditProc.stdout || '').trim();
if (!auditRaw) {
  console.error('[audit-gate] npm audit produced no JSON output.');
  if (auditProc.stderr) console.error(auditProc.stderr);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(auditRaw);
} catch (error) {
  console.error('[audit-gate] Failed to parse npm audit JSON output.');
  console.error(String(error));
  process.exit(1);
}

let exceptionsConfig = { exceptions: [] };
if (fs.existsSync(exceptionsPath)) {
  try {
    exceptionsConfig = JSON.parse(fs.readFileSync(exceptionsPath, 'utf8'));
  } catch (error) {
    console.error('[audit-gate] Failed to parse exceptions file:', exceptionsPath);
    console.error(String(error));
    process.exit(1);
  }
}

const now = new Date();
const exceptionRecords = Array.isArray(exceptionsConfig.exceptions)
  ? exceptionsConfig.exceptions
  : [];

const activeExceptions = new Map();
const expiredExceptions = new Map();
for (const entry of exceptionRecords) {
  if (!entry || typeof entry !== 'object') continue;
  const id = String(entry.id || '').trim().toUpperCase();
  if (!id) continue;
  const expiresOn = entry.expiresOn ? new Date(`${entry.expiresOn}T23:59:59Z`) : null;
  if (expiresOn && Number.isNaN(expiresOn.getTime())) {
    console.error(`[audit-gate] Invalid expiresOn for exception ${id}: ${entry.expiresOn}`);
    process.exit(1);
  }
  if (expiresOn && expiresOn < now) {
    expiredExceptions.set(id, entry);
    continue;
  }
  activeExceptions.set(id, entry);
}

const vulnerabilities = report?.vulnerabilities ?? {};

function parseGhsaId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
  return match ? match[0].toUpperCase() : null;
}

function normalizeSeverity(severity) {
  if (!severity) return 'low';
  const key = String(severity).toLowerCase();
  return Object.prototype.hasOwnProperty.call(severityRank, key) ? key : 'low';
}

function collectAdvisories(vulnName, seen = new Set()) {
  if (seen.has(vulnName)) return [];
  seen.add(vulnName);

  const vuln = vulnerabilities[vulnName];
  if (!vuln) return [];

  const items = [];
  const viaList = Array.isArray(vuln.via) ? vuln.via : [];

  for (const via of viaList) {
    if (typeof via === 'string') {
      items.push(...collectAdvisories(via, seen));
      continue;
    }
    if (!via || typeof via !== 'object') continue;

    const severity = normalizeSeverity(via.severity ?? vuln.severity);
    if (severityRank[severity] < HIGH_SEVERITY) continue;

    const id = parseGhsaId(via.url) ?? `SOURCE-${via.source ?? via.name ?? vulnName}`;
    items.push({
      id,
      title: String(via.title ?? vuln.name ?? vulnName),
      url: typeof via.url === 'string' ? via.url : null,
      severity,
      packageName: String(via.name ?? vuln.name ?? vulnName),
    });
  }

  return items;
}

const findingsById = new Map();

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  const severity = normalizeSeverity(vuln?.severity);
  if (severityRank[severity] < HIGH_SEVERITY) continue;

  const advisories = collectAdvisories(name);
  if (advisories.length === 0) {
    const syntheticId = `PKG-${name}`;
    if (!findingsById.has(syntheticId)) {
      findingsById.set(syntheticId, {
        id: syntheticId,
        title: `${name} has high severity audit finding without advisory metadata`,
        url: null,
        severity,
        packageNames: new Set([name]),
      });
    }
    continue;
  }

  for (const advisory of advisories) {
    const existing = findingsById.get(advisory.id);
    if (existing) {
      existing.packageNames.add(name);
      continue;
    }
    findingsById.set(advisory.id, {
      ...advisory,
      packageNames: new Set([name]),
    });
  }
}

const findings = [...findingsById.values()];
const unresolved = [];
const allowed = [];

for (const finding of findings) {
  if (activeExceptions.has(finding.id)) {
    allowed.push(finding);
  } else {
    unresolved.push(finding);
  }
}

if (allowed.length > 0) {
  console.log('[audit-gate] Allowed by active exception:');
  for (const finding of allowed) {
    const ex = activeExceptions.get(finding.id);
    console.log(`  - ${finding.id} (${finding.severity}) expires ${ex.expiresOn} :: ${ex.reason}`);
  }
}

if (expiredExceptions.size > 0) {
  console.log('[audit-gate] Expired exceptions:');
  for (const [id, ex] of expiredExceptions.entries()) {
    console.log(`  - ${id} expired on ${ex.expiresOn}`);
  }
}

if (unresolved.length > 0 || expiredExceptions.size > 0) {
  console.error('[audit-gate] Blocking push due to unresolved high/critical vulnerabilities.');
  for (const finding of unresolved) {
    const packages = [...finding.packageNames].join(', ');
    console.error(`  - ${finding.id} (${finding.severity}) in [${packages}]`);
    if (finding.url) console.error(`    ${finding.url}`);
  }
  process.exit(1);
}

console.log('[audit-gate] Passed: no unresolved high/critical vulnerabilities.');
process.exit(0);
