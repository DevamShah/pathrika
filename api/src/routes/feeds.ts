import type { FastifyInstance } from 'fastify';
import { getFeed, refreshAllFeeds } from '../services/feed-router.js';
import { FEEDS } from '../lib/feeds.js';
import { CATEGORY_LABELS } from '../lib/types.js';

export async function feedRoutes(app: FastifyInstance) {
  // List all feeds
  app.get('/api/feeds', async () => {
    return {
      ok: true,
      feeds: FEEDS.map((f) => ({
        ...f,
        categoryLabel: CATEGORY_LABELS[f.category],
      })),
    };
  });

  // Get single feed with items
  app.get<{ Params: { id: string } }>('/api/feeds/:id', async (req, reply) => {
    const result = await getFeed(req.params.id);
    if (!result) {
      reply.status(404);
      return { ok: false, error: 'Feed not found' };
    }
    return {
      ok: true,
      feed: result.feed,
      items: result.items,
      meta: {
        source: result.source,
        cached: result.cached,
        timestamp: result.timestamp,
      },
    };
  });

  // Force refresh all feeds
  app.post('/api/feeds/refresh', async () => {
    const result = await refreshAllFeeds();
    return { ok: true, ...result };
  });
}
