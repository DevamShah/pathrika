import type { FastifyInstance } from 'fastify';
import { getAllItems, searchItems } from '../services/feed-router.js';

export async function itemRoutes(app: FastifyInstance) {
  // Get all items (timeline)
  app.get<{
    Querystring: { limit?: string; offset?: string };
  }>('/api/items', async (req) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const items = await getAllItems(limit, offset);
    return { ok: true, items, meta: { limit, offset } };
  });

  // Search items
  app.get<{
    Querystring: { q: string; limit?: string };
  }>('/api/search', async (req, reply) => {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
      reply.status(400);
      return { ok: false, error: 'Query must be at least 2 characters' };
    }
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const items = await searchItems(query.trim(), limit);
    return { ok: true, query, items, meta: { limit } };
  });
}
