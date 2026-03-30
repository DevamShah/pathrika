import { fetchFeed } from '../adapters/rss-native.js';
import { isAvailable, recordSuccess, recordFailure } from '../lib/circuit-breaker.js';
import { getCached, setCache, feedCacheKey } from '../lib/redis.js';
import { db, schema } from '../db/index.js';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { FEEDS, getFeedsByCategory } from '../lib/feeds.js';
import type { FeedConfig, NormalizedItem, FetchResult, FeedCategory } from '../lib/types.js';
import pino from 'pino';

const log = pino({ name: 'feed-router' });

async function fetchWithCircuitBreaker(config: FeedConfig): Promise<FetchResult | null> {
  if (!isAvailable(config.id)) {
    log.warn({ feedId: config.id }, 'Feed circuit open, skipping');
    return null;
  }

  const start = Date.now();
  try {
    const { feed, items } = await fetchFeed(config);
    recordSuccess(config.id, Date.now() - start);

    // Persist to DB
    await db.insert(schema.feeds).values({
      id: feed.id,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      language: feed.language,
      category: feed.category,
      lastFetchedAt: feed.lastFetchedAt,
      itemCount: feed.itemCount,
    }).onConflictDoUpdate({
      target: schema.feeds.id,
      set: {
        title: feed.title,
        description: feed.description,
        lastFetchedAt: feed.lastFetchedAt,
        itemCount: feed.itemCount,
      },
    });

    // Upsert items
    for (const item of items) {
      await db.insert(schema.items).values({
        id: item.id,
        feedId: item.feedId,
        title: item.title,
        description: item.description,
        content: item.content,
        url: item.url,
        imageUrl: item.imageUrl,
        author: item.author,
        publishedAt: item.publishedAt,
        categories: item.categories,
      }).onConflictDoNothing();
    }

    const result: FetchResult = {
      feed,
      items,
      source: 'rss-native',
      cached: false,
      timestamp: new Date(),
    };

    // Cache the result
    await setCache(feedCacheKey(config.id), result);

    return result;
  } catch (err) {
    recordFailure(config.id);
    log.error({ feedId: config.id, err }, 'Feed fetch failed');
    return null;
  }
}

export async function getFeed(feedId: string): Promise<FetchResult | null> {
  const config = FEEDS.find((f) => f.id === feedId);
  if (!config) return null;

  // Check cache first
  const cached = await getCached<FetchResult>(feedCacheKey(feedId));
  if (cached && cached.age < 600_000) { // 10 min hot
    return { ...cached.data, cached: true };
  }

  // Try live fetch
  const live = await fetchWithCircuitBreaker(config);
  if (live) return live;

  // Warm cache fallback
  if (cached) {
    return { ...cached.data, cached: true };
  }

  // Stale DB fallback
  const dbFeed = await db.query.feeds.findFirst({ where: eq(schema.feeds.id, feedId) });
  if (!dbFeed) return null;

  const dbItems = await db.query.items.findMany({
    where: eq(schema.items.feedId, feedId),
    orderBy: [desc(schema.items.publishedAt)],
    limit: 50,
  });

  return {
    feed: {
      id: dbFeed.id,
      url: dbFeed.url,
      title: dbFeed.title,
      description: dbFeed.description,
      language: dbFeed.language,
      category: dbFeed.category as FeedCategory,
      lastFetchedAt: dbFeed.lastFetchedAt,
      itemCount: dbFeed.itemCount || 0,
    },
    items: dbItems.map((i) => ({
      id: i.id,
      feedId: i.feedId,
      title: i.title,
      description: i.description,
      content: i.content,
      url: i.url,
      imageUrl: i.imageUrl,
      author: i.author,
      publishedAt: i.publishedAt,
      categories: (i.categories || []) as string[],
    })),
    source: 'stale-db',
    cached: true,
    timestamp: dbFeed.lastFetchedAt || new Date(),
  };
}

export async function getCategoryItems(
  category: FeedCategory,
  limit = 50,
  offset = 0,
): Promise<{ items: NormalizedItem[]; total: number }> {
  const feedConfigs = getFeedsByCategory(category);
  const feedIds = feedConfigs.map((f) => f.id);

  if (feedIds.length === 0) return { items: [], total: 0 };

  const dbItems = await db.query.items.findMany({
    where: inArray(schema.items.feedId, feedIds),
    orderBy: [desc(schema.items.publishedAt)],
    limit,
    offset,
  });

  return {
    items: dbItems.map((i) => ({
      id: i.id,
      feedId: i.feedId,
      title: i.title,
      description: i.description,
      content: i.content,
      url: i.url,
      imageUrl: i.imageUrl,
      author: i.author,
      publishedAt: i.publishedAt,
      categories: (i.categories || []) as string[],
    })),
    total: dbItems.length,
  };
}

export async function getAllItems(limit = 50, offset = 0): Promise<NormalizedItem[]> {
  const dbItems = await db.query.items.findMany({
    orderBy: [desc(schema.items.publishedAt)],
    limit,
    offset,
  });

  return dbItems.map((i) => ({
    id: i.id,
    feedId: i.feedId,
    title: i.title,
    description: i.description,
    content: i.content,
    url: i.url,
    imageUrl: i.imageUrl,
    author: i.author,
    publishedAt: i.publishedAt,
    categories: (i.categories || []) as string[],
  }));
}

export async function refreshAllFeeds(): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Fetch feeds sequentially to avoid rate limiting
  for (const config of FEEDS) {
    const result = await fetchWithCircuitBreaker(config);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  log.info({ success, failed }, 'Feed refresh complete');
  return { success, failed };
}

export async function searchItems(query: string, limit = 30): Promise<NormalizedItem[]> {
  // Simple text search using ILIKE via drizzle
  const { sql } = await import('drizzle-orm');
  const pattern = `%${query}%`;
  const results = await db
    .select()
    .from(schema.items)
    .where(
      sql`${schema.items.title} ILIKE ${pattern} OR ${schema.items.description} ILIKE ${pattern}`,
    )
    .orderBy(desc(schema.items.publishedAt))
    .limit(limit);

  return results.map((i) => ({
    id: i.id,
    feedId: i.feedId,
    title: i.title,
    description: i.description,
    content: i.content,
    url: i.url,
    imageUrl: i.imageUrl,
    author: i.author,
    publishedAt: i.publishedAt,
    categories: (i.categories || []) as string[],
  }));
}
