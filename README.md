---
tags:
  - archeon
  - forgeon
  - product
  - product-pathrika
---

# Pathrika

**Personal RSS intelligence aggregator** — 25 curated feeds across 5 domains, with multi-source routing, circuit breaker resilience, three-tier caching, and a premium dark UI.

> *Pathrika* (पत्रिका) — Sanskrit for "periodical" or "newspaper"

---

## What It Does

Pathrika aggregates RSS feeds from sources you care about into a single, fast, searchable interface. It fetches, normalizes, caches, and serves articles from 25 feeds organized into 5 categories:

| Category | Sources |
|----------|---------|
| **Indian Politics** | The Hindu, NDTV, Times of India, Livemint Politics, Indian Express Political Pulse |
| **Geopolitics** | Foreign Policy, Al Jazeera, NYT World, BBC World, The Diplomat |
| **AI & Technology** | TechCrunch, MIT Technology Review, Ars Technica, The Verge AI, WIRED AI |
| **Finance & Economy** | Livemint Markets, Economic Times, Bloomberg Markets, MoneyControl, Financial Times |
| **Cybersecurity** | The Hacker News, BleepingComputer, Krebs on Security, Dark Reading, Threatpost |

Feeds are fully configurable in `api/src/lib/feeds.ts`.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────>│   Fastify    │────>│  PostgreSQL   │
│   Frontend   │     │   API        │     │  (persistent) │
│   :3101      │     │   :3100      │     │  :5436        │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │    Redis     │
                     │  (cache)     │
                     │  :6383       │
                     └──────────────┘
```

### Backend (API)

- **Fastify** — high-performance HTTP framework
- **Drizzle ORM** — type-safe PostgreSQL access
- **rss-parser** — RSS/Atom feed parsing with custom field extraction
- **Circuit breaker** — per-feed health tracking, 3-failure threshold, 5-minute cooldown, half-open probing
- **Three-tier caching** — Redis hot cache (10 min) → Redis warm cache (24 hr) → PostgreSQL stale fallback
- **Scheduler** — automatic feed refresh every 10 minutes via node-cron
- **Sanitization** — HTML sanitization on all feed content (sanitize-html)

### Frontend (Web)

- **Next.js 15** — App Router with server-side rendering and 5-minute ISR
- **Tailwind CSS v4** — utility-first styling with custom navy design system
- **Premium dark UI** — deep navy palette (#070b17), fade-in animations, staggered card rendering
- **Responsive** — sidebar navigation, category filtering, full-text search

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feeds` | List all 25 configured feeds |
| `GET` | `/api/feeds/:id` | Get feed details + latest items |
| `GET` | `/api/categories` | List all 5 categories |
| `GET` | `/api/categories/:slug` | Get items by category |
| `GET` | `/api/items?limit=&offset=` | Get all items (paginated) |
| `GET` | `/api/search?q=` | Full-text search across titles and descriptions |
| `GET` | `/api/health` | Feed health status for all 25 sources |
| `POST` | `/api/feeds/refresh` | Force-refresh all feeds |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local development)

### With Docker Compose

```bash
docker-compose up
```

- **Web UI:** http://localhost:3101
- **API:** http://localhost:3100
- **PostgreSQL:** localhost:5436
- **Redis:** localhost:6383

First boot takes ~30 seconds to fetch all 25 feeds.

### Local Development

```bash
# Start infrastructure
docker run -d --name pathrika-postgres \
  -e POSTGRES_DB=pathrika -e POSTGRES_USER=pathrika -e POSTGRES_PASSWORD=pathrika_dev \
  -p 5436:5432 postgres:16-alpine

docker run -d --name pathrika-redis -p 6383:6379 redis:7-alpine

# API
cd api
npm install
DATABASE_URL="postgres://pathrika:pathrika_dev@localhost:5436/pathrika" \
REDIS_URL="redis://localhost:6383" \
npx tsx src/db/migrate.ts    # Run migrations
DATABASE_URL="postgres://pathrika:pathrika_dev@localhost:5436/pathrika" \
REDIS_URL="redis://localhost:6383" \
npm run dev                  # Start API on :3100

# Web (separate terminal)
cd web
npm install
NEXT_PUBLIC_API_URL=http://localhost:3100 npm run dev  # Start on :3101
```

---

## Configuration

### Adding/Removing Feeds

Edit `api/src/lib/feeds.ts`:

```typescript
{
  id: 'your-feed-id',
  url: 'https://example.com/feed.xml',
  title: 'Your Feed',
  category: 'ai-technology',  // Must match a FeedCategory
}
```

### Adding Categories

1. Add the category to `FeedCategory` type in `api/src/lib/types.ts`
2. Add the label to `CATEGORY_LABELS` in the same file
3. Add icon/color in `web/src/lib/types.ts`
4. Add navigation entry in `web/src/components/category-nav.tsx`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://pathrika:pathrika_dev@localhost:5436/pathrika` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6383` | Redis connection string |
| `PORT` | `3100` | API server port |
| `FETCH_INTERVAL_MS` | `600000` | Feed refresh interval (ms) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3100` | API URL for browser requests |
| `API_INTERNAL_URL` | Same as above | API URL for server-side requests |

---

## Resilience Model

Pathrika is designed to never show users an error page.

### Circuit Breaker (per feed)

Each feed has independent health tracking:

- **CLOSED (healthy):** Requests pass through normally
- **OPEN (unhealthy):** After 3 consecutive failures, feed is blocked for 5 minutes
- **HALF-OPEN:** After cooldown, one probe request is allowed. Success resets; failure extends cooldown.

### Three-Tier Cache Fallback

```
Request → Redis HOT cache (10 min TTL)
       → Redis WARM cache (24 hr TTL)
       → Live RSS fetch (with circuit breaker)
       → PostgreSQL stale data (last known good)
```

Users always see content. Stale data is served with appropriate metadata rather than showing an error.

---

## Quality Assurance

### Pre-Commit Hook

Every commit is blocked unless:
1. API TypeScript compiles clean
2. Web TypeScript compiles clean
3. Frontend builds without errors
4. No secrets detected (gitleaks)

Configured via `.claude/settings.json` — cannot be bypassed.

### Rudron Quality Gate

Full 11-check automated quality gate (`qa/rudron-gate.sh`):

| Check | Tool |
|-------|------|
| API TypeScript compilation | `tsc --noEmit` |
| Web TypeScript compilation | `tsc --noEmit` |
| API health check | `curl /api/health` |
| Web health check | `curl localhost:3101` |
| Secret scan | gitleaks |
| Dependency vulnerabilities | trivy |
| Static analysis | semgrep |
| Headless browser test | Playwright (14 pages) |
| QA screenshots | 14 required |
| API endpoint smoke test | All endpoints return 200 |
| Feed fetch verification | 15+ feeds healthy |

Run: `./qa/rudron-gate.sh 5`

### Headless Browser Tests

Playwright tests every page and API endpoint, capturing full-page screenshots as evidence:

```bash
python3 qa/headless_test.py
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| API Framework | Fastify | 5.x |
| ORM | Drizzle | 0.39.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| RSS Parser | rss-parser | 3.x |
| Frontend | Next.js | 15.x |
| Styling | Tailwind CSS | 4.x |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 22+ |
| Browser Tests | Playwright | 1.58.x |

---

## Project Structure

```
pathrika/
├── api/                          # Fastify backend
│   ├── src/
│   │   ├── adapters/             # RSS feed parser
│   │   │   └── rss-native.ts     # rss-parser adapter with image extraction
│   │   ├── db/                   # Database layer
│   │   │   ├── schema.ts         # Drizzle ORM schema (feeds, items, health)
│   │   │   ├── index.ts          # Database connection
│   │   │   └── migrate.ts        # Migration runner
│   │   ├── lib/                  # Shared utilities
│   │   │   ├── circuit-breaker.ts # Per-feed health tracking
│   │   │   ├── redis.ts          # Cache layer (hot/warm TTL)
│   │   │   ├── types.ts          # Normalized data types
│   │   │   └── feeds.ts          # Feed configuration (25 feeds)
│   │   ├── routes/               # API endpoints
│   │   │   ├── feeds.ts          # /api/feeds, /api/feeds/:id
│   │   │   ├── items.ts          # /api/items, /api/search
│   │   │   ├── categories.ts     # /api/categories, /api/categories/:slug
│   │   │   └── health.ts         # /api/health
│   │   ├── services/             # Business logic
│   │   │   ├── feed-router.ts    # Multi-source routing + fallback
│   │   │   └── scheduler.ts      # Cron-based feed refresh
│   │   └── server.ts             # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── web/                          # Next.js frontend
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── page.tsx          # Home (all stories)
│   │   │   ├── layout.tsx        # Root layout with sidebar
│   │   │   ├── category/[slug]/  # Category pages
│   │   │   ├── feed/[id]/        # Individual feed pages
│   │   │   ├── search/           # Search results
│   │   │   ├── health/           # Feed health dashboard
│   │   │   └── globals.css       # Navy design system
│   │   ├── components/           # React components
│   │   │   ├── article-card.tsx  # Article card with image + metadata
│   │   │   ├── category-nav.tsx  # Sidebar navigation
│   │   │   └── search-bar.tsx    # Search input
│   │   └── lib/                  # Client utilities
│   │       ├── api.ts            # API client (SSR + client)
│   │       └── types.ts          # Shared types + category config
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── qa/                           # Quality assurance
│   ├── pre-commit-check.sh       # Pre-commit gate (TSC + build + secrets)
│   ├── rudron-gate.sh            # Full quality gate (11 checks)
│   ├── headless_test.py          # Playwright browser tests
│   └── screenshots/              # Evidence captures
├── .claude/settings.json         # Claude Code enforcement hooks
├── docker-compose.yml            # Full stack orchestration
├── CLAUDE.md                     # Product enforcement rules
├── SECURITY.md                   # Security policy
├── CONTRIBUTING.md               # Contribution guidelines
└── LICENSE                       # AGPL-3.0 (strict copyleft)
```

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [LICENSE](LICENSE) for details.

This means:
- You can use, modify, and distribute this software
- Any modified version must also be released under AGPL-3.0
- If you run a modified version as a network service, you must make the source code available to users
- No proprietary forks allowed

---

## Author

**Devam Shah** — [@anthropics](https://github.com/anthropics)

Built with the [Archeon](https://github.com/anthropics) autonomous product factory.
