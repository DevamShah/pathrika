import type { FeedConfig, NormalizedItem, CategoryInfo } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
const INTERNAL_API = process.env.API_INTERNAL_URL || API_BASE;

function getBase(isServer: boolean): string {
  return isServer ? INTERNAL_API : API_BASE;
}

async function fetchApi<T>(path: string, isServer = false): Promise<T> {
  const base = getBase(isServer);
  const res = await fetch(`${base}${path}`, {
    next: { revalidate: 300 }, // 5 min ISR
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getFeeds(isServer = false): Promise<FeedConfig[]> {
  const data = await fetchApi<{ ok: boolean; feeds: FeedConfig[] }>('/api/feeds', isServer);
  return data.feeds;
}

export async function getFeedItems(
  feedId: string,
  isServer = false,
): Promise<{ feed: FeedConfig; items: NormalizedItem[] }> {
  const data = await fetchApi<{ ok: boolean; feed: FeedConfig; items: NormalizedItem[] }>(
    `/api/feeds/${feedId}`,
    isServer,
  );
  return { feed: data.feed, items: data.items };
}

export async function getCategories(isServer = false): Promise<CategoryInfo[]> {
  const data = await fetchApi<{ ok: boolean; categories: CategoryInfo[] }>(
    '/api/categories',
    isServer,
  );
  return data.categories;
}

export async function getCategoryItems(
  slug: string,
  limit = 50,
  offset = 0,
  isServer = false,
): Promise<{ category: CategoryInfo; items: NormalizedItem[] }> {
  const data = await fetchApi<{
    ok: boolean;
    category: CategoryInfo;
    items: NormalizedItem[];
  }>(`/api/categories/${slug}?limit=${limit}&offset=${offset}`, isServer);
  return { category: data.category, items: data.items };
}

export async function getAllItems(
  limit = 50,
  offset = 0,
  isServer = false,
): Promise<NormalizedItem[]> {
  const data = await fetchApi<{ ok: boolean; items: NormalizedItem[] }>(
    `/api/items?limit=${limit}&offset=${offset}`,
    isServer,
  );
  return data.items;
}

export async function searchItems(
  query: string,
  isServer = false,
): Promise<NormalizedItem[]> {
  const data = await fetchApi<{ ok: boolean; items: NormalizedItem[] }>(
    `/api/search?q=${encodeURIComponent(query)}`,
    isServer,
  );
  return data.items;
}

export async function getHealth(isServer = false) {
  return fetchApi<{
    ok: boolean;
    status: string;
    summary: string;
    feeds: Array<{
      feedId: string;
      title: string;
      category: string;
      isHealthy: boolean;
      consecutiveFailures: number;
      avgLatencyMs: number;
    }>;
  }>('/api/health', isServer);
}
