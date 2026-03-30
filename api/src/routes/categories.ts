import type { FastifyInstance } from 'fastify';
import { getCategoryItems } from '../services/feed-router.js';
import { CATEGORY_LABELS, type FeedCategory } from '../lib/types.js';

export async function categoryRoutes(app: FastifyInstance) {
  // List categories
  app.get('/api/categories', async () => {
    return {
      ok: true,
      categories: Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
    };
  });

  // Get items by category
  app.get<{
    Params: { slug: string };
    Querystring: { limit?: string; offset?: string };
  }>('/api/categories/:slug', async (req, reply) => {
    const slug = req.params.slug as FeedCategory;
    if (!CATEGORY_LABELS[slug]) {
      reply.status(404);
      return { ok: false, error: 'Category not found' };
    }

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const { items, total } = await getCategoryItems(slug, limit, offset);

    return {
      ok: true,
      category: { id: slug, label: CATEGORY_LABELS[slug] },
      items,
      meta: { limit, offset, total },
    };
  });
}
