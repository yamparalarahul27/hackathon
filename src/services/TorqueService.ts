/**
 * Torque Service — event ingestion + incentive results
 *
 * Two integration points:
 * 1. Event ingestion (POST to ingest.torque.so/events) — tracks user activity
 * 2. Incentive results (GET from server.torque.so) — leaderboard data
 *
 * Docs: https://docs.torque.so
 */

import {
  TORQUE_API_URL,
  TORQUE_INGEST_URL,
  TORQUE_API_TOKEN,
  TORQUE_API_KEY,
} from '../lib/constants';

// ── Types ────────────────────────────────────────────────────────

export interface TorqueEvent {
  userPubkey: string;
  eventName: string;
  data: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface LeaderboardEntry {
  walletAddress: string;
  metricValue: number;
}

export interface LeaderboardResult {
  results: LeaderboardEntry[];
  total: number;
  lastUpdated: string | null;
}

export interface TorqueIncentive {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// ── Configuration check ──────────────────────────────────────────

export function isTorqueConfigured(): boolean {
  return Boolean(TORQUE_API_TOKEN || TORQUE_API_KEY);
}

export function isIngestConfigured(): boolean {
  return Boolean(TORQUE_API_KEY);
}

// ── Event Ingestion ──────────────────────────────────────────────

/**
 * Send a custom event to Torque's ingestion pipeline.
 * Requires TORQUE_API_KEY (created via MCP or platform dashboard).
 */
export async function sendEvent(event: TorqueEvent): Promise<void> {
  if (!TORQUE_API_KEY) return;

  const body = {
    userPubkey: event.userPubkey,
    timestamp: event.timestamp ?? Date.now(),
    eventName: event.eventName,
    data: event.data,
  };

  await fetch(`${TORQUE_INGEST_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TORQUE_API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {
    // Fire-and-forget — never block the user flow for analytics
  });
}

// ── Pre-built event helpers ──────────────────────────────────────

export function trackSwapEvent(
  userPubkey: string,
  inputMint: string,
  outputMint: string,
  inputAmount: string,
  outputAmount: string,
  txSignature: string
): void {
  void sendEvent({
    userPubkey,
    eventName: 'defi_triangle_swap',
    data: {
      inputMint,
      outputMint,
      inputAmount,
      outputAmount,
      txSignature,
    },
  });
}

export function trackDepositEvent(
  userPubkey: string,
  vaultAddress: string,
  amount: string,
  txSignature: string
): void {
  void sendEvent({
    userPubkey,
    eventName: 'defi_triangle_deposit',
    data: {
      vaultAddress,
      amount,
      txSignature,
    },
  });
}

export function trackShieldEvent(
  userPubkey: string,
  mint: string,
  amount: string
): void {
  void sendEvent({
    userPubkey,
    eventName: 'defi_triangle_shield',
    data: { mint, amount },
  });
}

export function trackWalletConnect(userPubkey: string): void {
  void sendEvent({
    userPubkey,
    eventName: 'defi_triangle_connect',
    data: { action: 'wallet_connect' },
  });
}

// ── Server API (incentive results) ───────────────────────────────

async function torqueApi<T>(path: string): Promise<T> {
  if (!TORQUE_API_TOKEN) {
    throw new Error('Torque API token not configured');
  }

  const res = await fetch(`${TORQUE_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${TORQUE_API_TOKEN}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Torque API ${res.status}: ${path}`);
  }

  const json = await res.json();
  if (json.status === 'SUCCESS') return json.data as T;
  throw new Error(json.message ?? 'Torque API error');
}

/**
 * List all recurring incentives for the active project.
 */
export async function listIncentives(): Promise<TorqueIncentive[]> {
  return torqueApi<TorqueIncentive[]>('/incentives');
}

/**
 * Get leaderboard results for a specific incentive config.
 */
export async function getLeaderboard(
  incentiveId: string,
  configId: string,
  limit = 20,
  offset = 0
): Promise<LeaderboardResult> {
  return torqueApi<LeaderboardResult>(
    `/incentives/${incentiveId}/configs/${configId}/results?mode=preview&limit=${limit}&offset=${offset}`
  );
}
