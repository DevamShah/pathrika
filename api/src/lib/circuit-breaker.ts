import type { FeedHealthStatus } from './types.js';

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 300_000; // 5 minutes

const healthMap = new Map<string, FeedHealthStatus>();

export function getHealth(feedId: string): FeedHealthStatus {
  if (!healthMap.has(feedId)) {
    healthMap.set(feedId, {
      feedId,
      isHealthy: true,
      consecutiveFailures: 0,
      lastSuccess: null,
      lastFailure: null,
      avgLatencyMs: 0,
      unhealthyUntil: null,
    });
  }
  return healthMap.get(feedId)!;
}

export function recordSuccess(feedId: string, latencyMs: number): void {
  const h = getHealth(feedId);
  h.isHealthy = true;
  h.consecutiveFailures = 0;
  h.lastSuccess = new Date();
  h.unhealthyUntil = null;
  h.avgLatencyMs = h.avgLatencyMs === 0
    ? latencyMs
    : Math.round(h.avgLatencyMs * 0.7 + latencyMs * 0.3);
}

export function recordFailure(feedId: string): void {
  const h = getHealth(feedId);
  h.consecutiveFailures += 1;
  h.lastFailure = new Date();
  if (h.consecutiveFailures >= FAILURE_THRESHOLD) {
    h.isHealthy = false;
    h.unhealthyUntil = new Date(Date.now() + COOLDOWN_MS);
  }
}

export function isAvailable(feedId: string): boolean {
  const h = getHealth(feedId);
  if (h.isHealthy) return true;
  if (h.unhealthyUntil && new Date() > h.unhealthyUntil) {
    // Half-open: allow one probe
    h.unhealthyUntil = new Date(Date.now() + COOLDOWN_MS);
    return true;
  }
  return false;
}

export function getAllHealth(): FeedHealthStatus[] {
  return Array.from(healthMap.values());
}
