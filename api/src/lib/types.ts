export interface FeedConfig {
  id: string;
  url: string;
  title: string;
  category: FeedCategory;
  language?: string;
}

export type FeedCategory =
  | 'indian-politics'
  | 'geopolitics'
  | 'ai-technology'
  | 'finance-economy'
  | 'cybersecurity';

export const CATEGORY_LABELS: Record<FeedCategory, string> = {
  'indian-politics': 'Indian Politics',
  'geopolitics': 'Geopolitics',
  'ai-technology': 'AI & Technology',
  'finance-economy': 'Finance & Economy',
  'cybersecurity': 'Cybersecurity',
};

export interface NormalizedItem {
  id: string;
  feedId: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: Date;
  categories: string[];
}

export interface NormalizedFeed {
  id: string;
  url: string;
  title: string;
  description: string | null;
  language: string | null;
  category: FeedCategory;
  lastFetchedAt: Date | null;
  itemCount: number;
}

export interface FeedHealthStatus {
  feedId: string;
  isHealthy: boolean;
  consecutiveFailures: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  avgLatencyMs: number;
  unhealthyUntil: Date | null;
}

export interface FetchResult {
  feed: NormalizedFeed;
  items: NormalizedItem[];
  source: string;
  cached: boolean;
  timestamp: Date;
}
