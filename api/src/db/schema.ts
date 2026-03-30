import { pgTable, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language'),
  category: text('category').notNull(),
  lastFetchedAt: timestamp('last_fetched_at'),
  itemCount: integer('item_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('feeds_category_idx').on(t.category),
]);

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  content: text('content'),
  url: text('url').notNull(),
  imageUrl: text('image_url'),
  author: text('author'),
  publishedAt: timestamp('published_at').notNull(),
  categories: jsonb('categories').$type<string[]>().default([]),
  fetchedAt: timestamp('fetched_at').defaultNow(),
}, (t) => [
  index('items_feed_id_idx').on(t.feedId),
  index('items_published_at_idx').on(t.publishedAt),
  index('items_feed_published_idx').on(t.feedId, t.publishedAt),
]);

export const feedHealth = pgTable('feed_health', {
  feedId: text('feed_id').primaryKey().references(() => feeds.id),
  isHealthy: boolean('is_healthy').default(true),
  consecutiveFailures: integer('consecutive_failures').default(0),
  lastSuccess: timestamp('last_success'),
  lastFailure: timestamp('last_failure'),
  avgLatencyMs: integer('avg_latency_ms').default(0),
  unhealthyUntil: timestamp('unhealthy_until'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
