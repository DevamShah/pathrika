import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

// RSS updates less frequently than Twitter — longer TTLs
const HOT_TTL = 600;       // 10 minutes
const WARM_TTL = 86_400;   // 24 hours

export async function getCached<T>(key: string): Promise<{ data: T; age: number } | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { data: T; cachedAt: number };
  return { data: parsed.data, age: Date.now() - parsed.cachedAt };
}

export async function setCache<T>(key: string, data: T, warm = false): Promise<void> {
  const ttl = warm ? WARM_TTL : HOT_TTL;
  await redis.setex(key, ttl, JSON.stringify({ data, cachedAt: Date.now() }));
}

export function feedCacheKey(feedId: string): string {
  return `feed:${feedId}`;
}

export function categoryCacheKey(category: string): string {
  return `category:${category}`;
}
