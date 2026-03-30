import Fastify from 'fastify';
import cors from '@fastify/cors';
import { feedRoutes } from './routes/feeds.js';
import { itemRoutes } from './routes/items.js';
import { categoryRoutes } from './routes/categories.js';
import { healthRoutes } from './routes/health.js';
import { startScheduler } from './services/scheduler.js';
import pino from 'pino';

const log = pino({ name: 'pathrika' });

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST'],
  });

  // Register routes
  await app.register(feedRoutes);
  await app.register(itemRoutes);
  await app.register(categoryRoutes);
  await app.register(healthRoutes);

  // Run migrations
  try {
    await import('./db/migrate.js');
  } catch {
    log.info('Running inline migration...');
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL || 'postgres://pathrika:pathrika_dev@localhost:5432/pathrika');

    await sql`
      CREATE TABLE IF NOT EXISTS feeds (
        id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
        description TEXT, language TEXT, category TEXT NOT NULL,
        last_fetched_at TIMESTAMPTZ, item_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS feeds_category_idx ON feeds(category)`;
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY, feed_id TEXT NOT NULL REFERENCES feeds(id),
        title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
        content TEXT, url TEXT NOT NULL, image_url TEXT, author TEXT,
        published_at TIMESTAMPTZ NOT NULL, categories JSONB DEFAULT '[]',
        fetched_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS items_feed_id_idx ON items(feed_id)`;
    await sql`CREATE INDEX IF NOT EXISTS items_published_at_idx ON items(published_at)`;
    await sql`CREATE INDEX IF NOT EXISTS items_feed_published_idx ON items(feed_id, published_at)`;
    await sql`
      CREATE TABLE IF NOT EXISTS feed_health (
        feed_id TEXT PRIMARY KEY REFERENCES feeds(id),
        is_healthy BOOLEAN DEFAULT true, consecutive_failures INTEGER DEFAULT 0,
        last_success TIMESTAMPTZ, last_failure TIMESTAMPTZ,
        avg_latency_ms INTEGER DEFAULT 0, unhealthy_until TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql.end();
    log.info('Inline migration complete');
  }

  // Start scheduler
  startScheduler();

  const port = parseInt(process.env.PORT || '3100', 10);
  await app.listen({ port, host: '0.0.0.0' });
  log.info({ port }, 'Pathrika API running');
}

main().catch((err) => {
  log.error(err, 'Failed to start');
  process.exit(1);
});
