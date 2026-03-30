import type { FeedConfig } from './types.js';

export const FEEDS: FeedConfig[] = [
  // ── Indian Politics ──
  {
    id: 'the-hindu',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    title: 'The Hindu',
    category: 'indian-politics',
  },
  {
    id: 'ndtv-india',
    url: 'https://feeds.feedburner.com/ndtvnews-india-news',
    title: 'NDTV India',
    category: 'indian-politics',
  },
  {
    id: 'toi-politics',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/1221656.cms',
    title: 'Times of India',
    category: 'indian-politics',
  },
  {
    id: 'livemint-politics',
    url: 'https://www.livemint.com/rss/politics',
    title: 'Livemint Politics',
    category: 'indian-politics',
  },
  {
    id: 'indian-express',
    url: 'https://indianexpress.com/section/political-pulse/feed/',
    title: 'Indian Express Political Pulse',
    category: 'indian-politics',
  },

  // ── Geopolitics ──
  {
    id: 'foreign-policy',
    url: 'https://foreignpolicy.com/feed/',
    title: 'Foreign Policy',
    category: 'geopolitics',
  },
  {
    id: 'aljazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    title: 'Al Jazeera',
    category: 'geopolitics',
  },
  {
    id: 'nyt-world',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    title: 'NYT World',
    category: 'geopolitics',
  },
  {
    id: 'bbc-world',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    title: 'BBC World',
    category: 'geopolitics',
  },
  {
    id: 'the-diplomat',
    url: 'https://thediplomat.com/feed/',
    title: 'The Diplomat',
    category: 'geopolitics',
  },

  // ── AI & Technology ──
  {
    id: 'techcrunch',
    url: 'https://techcrunch.com/feed/',
    title: 'TechCrunch',
    category: 'ai-technology',
  },
  {
    id: 'mit-tech-review',
    url: 'https://www.technologyreview.com/feed/',
    title: 'MIT Technology Review',
    category: 'ai-technology',
  },
  {
    id: 'ars-technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    title: 'Ars Technica',
    category: 'ai-technology',
  },
  {
    id: 'the-verge-ai',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    title: 'The Verge AI',
    category: 'ai-technology',
  },
  {
    id: 'wired-ai',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    title: 'WIRED AI',
    category: 'ai-technology',
  },

  // ── Finance & Economy ──
  {
    id: 'livemint-markets',
    url: 'https://www.livemint.com/rss/markets',
    title: 'Livemint Markets',
    category: 'finance-economy',
  },
  {
    id: 'economic-times',
    url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    title: 'Economic Times',
    category: 'finance-economy',
  },
  {
    id: 'bloomberg-markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    title: 'Bloomberg Markets',
    category: 'finance-economy',
  },
  {
    id: 'moneycontrol',
    url: 'https://www.moneycontrol.com/rss/latestnews.xml',
    title: 'MoneyControl',
    category: 'finance-economy',
  },
  {
    id: 'ft',
    url: 'https://www.ft.com/?format=rss',
    title: 'Financial Times',
    category: 'finance-economy',
  },

  // ── Cybersecurity ──
  {
    id: 'hacker-news-security',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    title: 'The Hacker News',
    category: 'cybersecurity',
  },
  {
    id: 'bleepingcomputer',
    url: 'https://www.bleepingcomputer.com/feed/',
    title: 'BleepingComputer',
    category: 'cybersecurity',
  },
  {
    id: 'krebs',
    url: 'https://krebsonsecurity.com/feed/',
    title: 'Krebs on Security',
    category: 'cybersecurity',
  },
  {
    id: 'dark-reading',
    url: 'https://www.darkreading.com/rss.xml',
    title: 'Dark Reading',
    category: 'cybersecurity',
  },
  {
    id: 'threatpost',
    url: 'https://threatpost.com/feed/',
    title: 'Threatpost',
    category: 'cybersecurity',
  },
];

export function getFeedsByCategory(category: string): FeedConfig[] {
  return FEEDS.filter((f) => f.category === category);
}

export function getFeedById(id: string): FeedConfig | undefined {
  return FEEDS.find((f) => f.id === id);
}
