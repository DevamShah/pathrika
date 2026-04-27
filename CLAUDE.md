---
tags:
  - archeon
  - forgeon
  - product
  - product-pathrika
---

# Pathrika — RSS Intelligence Aggregator

## Enforcement Rules (Non-Negotiable)

1. **No code ships without `rudron-gate.sh` APPROVED.** Run `./qa/rudron-gate.sh 5` before any gate presentation.
2. **Pre-commit hook is active.** `.claude/settings.json` hooks block commits that fail QA. Do NOT bypass.
3. **Every page must have a screenshot.** Run `python3 qa/headless_test.py` — all pages must pass, all screenshots must exist.
4. **MCA is mandatory.** Maker produces → Checker validates → Rudron approves. No exceptions.
5. **Harion does not write code.** Code production routes through Maker agents only.
6. **"Done" = Rudron script says APPROVED.** Nothing else counts.

## Architecture

- **API:** Fastify + TypeScript + Drizzle ORM + PostgreSQL + Redis
- **Web:** Next.js 15 + Tailwind CSS v4 + TypeScript
- **Infrastructure:** Docker Compose (PostgreSQL, Redis, API, Web)

## QA Scripts

| Script | Purpose | When |
|--------|---------|------|
| `qa/pre-commit-check.sh` | Blocks bad commits (TSC + build + gitleaks) | Every commit (hook) |
| `qa/rudron-gate.sh [1-5]` | Full quality gate (10+ checks) | Before gate presentation |
| `qa/headless_test.py` | Headless browser test + screenshots | Before Gate 5 |

## Ports

- API: `localhost:3100`
- Web: `localhost:3101`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
