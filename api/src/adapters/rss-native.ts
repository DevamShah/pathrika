import Parser from 'rss-parser';
import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import type { NormalizedItem, NormalizedFeed, FeedConfig } from '../lib/types.js';

const parser = new Parser({
  timeout: 15_000,
  headers: {
    'User-Agent': 'Pathrika/1.0 (RSS Aggregator)',
    Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

function makeItemId(item: Parser.Item, feedId: string): string {
  const raw = item.guid || item.link || `${item.title}-${item.pubDate}`;
  return crypto.createHash('sha256').update(`${feedId}:${raw}`).digest('hex').slice(0, 16);
}

function extractImage(item: Record<string, unknown>): string | null {
  // Try media:content
  const mc = item.mediaContent as Record<string, unknown> | undefined;
  if (mc) {
    const inner = mc['$'] as Record<string, string> | undefined;
    if (inner?.url) return inner.url;
    if (typeof mc.url === 'string') return mc.url;
  }

  // Try media:thumbnail
  const mt = item.mediaThumbnail as Record<string, unknown> | undefined;
  if (mt) {
    const inner = mt['$'] as Record<string, string> | undefined;
    if (inner?.url) return inner.url;
  }

  // Try enclosure
  const enc = item.enclosure as { url?: string; type?: string } | undefined;
  if (enc?.url && enc.type?.startsWith('image/')) return enc.url;

  // Try og:image from content
  const content = (item.content as string) || (item['content:encoded'] as string) || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch?.[1]) return imgMatch[1];

  return null;
}

function sanitize(html: string | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'blockquote'],
    allowedAttributes: { a: ['href', 'target'] },
  });
}

export async function fetchFeed(config: FeedConfig): Promise<{
  feed: NormalizedFeed;
  items: NormalizedItem[];
}> {
  const result = await parser.parseURL(config.url);

  const normalizedItems: NormalizedItem[] = (result.items || []).map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    return {
      id: makeItemId(item, config.id),
      feedId: config.id,
      title: (item.title || 'Untitled').trim(),
      description: sanitize(item.contentSnippet || item.summary || item.content || ''),
      content: sanitize(item.content || (raw['content:encoded'] as string) || ''),
      url: item.link || '',
      imageUrl: extractImage(raw),
      author: item.creator || (raw.author as string) || null,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      categories: (item.categories || []).map((c) => (typeof c === 'string' ? c : String(c))).filter(Boolean),
    };
  });

  const feed: NormalizedFeed = {
    id: config.id,
    url: config.url,
    title: result.title || config.title,
    description: result.description || null,
    language: result.language || config.language || null,
    category: config.category,
    lastFetchedAt: new Date(),
    itemCount: normalizedItems.length,
  };

  return { feed, items: normalizedItems };
}
