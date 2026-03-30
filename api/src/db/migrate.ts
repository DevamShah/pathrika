import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://pathrika:pathrika_dev@localhost:5432/pathrika';

async function migrate() {
  const sql = postgres(DATABASE_URL);

  console.log('Running migrations...');

  await sql`
    CREATE TABLE IF NOT EXISTS feeds (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      language TEXT,
      category TEXT NOT NULL,
      last_fetched_at TIMESTAMPTZ,
      item_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS feeds_category_idx ON feeds(category)`;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      feed_id TEXT NOT NULL REFERENCES feeds(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT,
      url TEXT NOT NULL,
      image_url TEXT,
      author TEXT,
      published_at TIMESTAMPTZ NOT NULL,
      categories JSONB DEFAULT '[]',
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS items_feed_id_idx ON items(feed_id)`;
  await sql`CREATE INDEX IF NOT EXISTS items_published_at_idx ON items(published_at)`;
  await sql`CREATE INDEX IF NOT EXISTS items_feed_published_idx ON items(feed_id, published_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS feed_health (
      feed_id TEXT PRIMARY KEY REFERENCES feeds(id),
      is_healthy BOOLEAN DEFAULT true,
      consecutive_failures INTEGER DEFAULT 0,
      last_success TIMESTAMPTZ,
      last_failure TIMESTAMPTZ,
      avg_latency_ms INTEGER DEFAULT 0,
      unhealthy_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log('Migrations complete.');
  await sql.end();
}

migrate().catch(console.error);
