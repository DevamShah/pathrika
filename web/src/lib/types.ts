export type FeedCategory =
  | 'indian-politics'
  | 'geopolitics'
  | 'ai-technology'
  | 'finance-economy'
  | 'cybersecurity';

export interface FeedConfig {
  id: string;
  url: string;
  title: string;
  category: FeedCategory;
  categoryLabel: string;
}

export interface NormalizedItem {
  id: string;
  feedId: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;
  categories: string[];
}

export interface CategoryInfo {
  id: FeedCategory;
  label: string;
}

export const CATEGORY_ICONS: Record<FeedCategory, string> = {
  'indian-politics': '🏛️',
  'geopolitics': '🌍',
  'ai-technology': '🤖',
  'finance-economy': '📈',
  'cybersecurity': '🛡️',
};

export const CATEGORY_COLORS: Record<FeedCategory, string> = {
  'indian-politics': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'geopolitics': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'ai-technology': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'finance-economy': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'cybersecurity': 'text-red-400 bg-red-400/10 border-red-400/20',
};
