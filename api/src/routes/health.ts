import type { FastifyInstance } from 'fastify';
import { getAllHealth } from '../lib/circuit-breaker.js';
import { FEEDS } from '../lib/feeds.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => {
    const healthData = getAllHealth();
    const healthy = healthData.filter((h) => h.isHealthy).length;
    const total = FEEDS.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthy === total) status = 'healthy';
    else if (healthy > total / 2) status = 'degraded';
    else status = 'unhealthy';

    return {
      ok: true,
      status,
      summary: `${healthy}/${total} feeds healthy`,
      feeds: healthData.map((h) => {
        const config = FEEDS.find((f) => f.id === h.feedId);
        return {
          ...h,
          title: config?.title,
          category: config?.category,
        };
      }),
    };
  });
}
