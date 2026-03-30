# Contributing to Pathrika

Thank you for your interest in contributing to Pathrika.

## License

By contributing to this project, you agree that your contributions will be licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See [LICENSE](LICENSE) for the full text.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up the development environment (see [README.md](README.md#local-development))
4. Create a feature branch from `main`

## Development Workflow

### Before You Code

- Open an issue describing what you want to change
- Wait for confirmation that the change is welcome
- For security issues, see [SECURITY.md](SECURITY.md)

### Code Standards

- **Language:** TypeScript (strict mode) for both API and Web
- **API framework:** Fastify with typed routes
- **Database:** Drizzle ORM — no raw SQL unless necessary (search is an exception)
- **Frontend:** Next.js App Router with server components by default
- **Styling:** Tailwind CSS v4 — use the existing navy design system
- **No `any` types** — use `unknown` + type guards if type is uncertain

### Quality Requirements

Every PR must pass the pre-commit checks:

1. `cd api && npx tsc --noEmit` — zero errors
2. `cd web && npx tsc --noEmit` — zero errors
3. `cd web && npx next build` — clean build
4. `gitleaks detect --source api/src --no-banner --no-git` — no secrets

For significant changes, run the full quality gate:

```bash
./qa/rudron-gate.sh 5
```

### Adding a New Feed

1. Add the feed config to `api/src/lib/feeds.ts`
2. Ensure the category exists in `api/src/lib/types.ts`
3. Test that the feed parses correctly: start the API and check `/api/feeds/{id}`
4. Verify the feed appears in the correct category page

### Adding a New Category

1. Add to `FeedCategory` type and `CATEGORY_LABELS` in `api/src/lib/types.ts`
2. Add icon and color mapping in `web/src/lib/types.ts`
3. Add navigation entry in `web/src/components/category-nav.tsx`
4. Add the category page test to `qa/headless_test.py`

## Pull Request Process

1. Ensure all pre-commit checks pass
2. Write a clear PR description explaining what and why
3. Reference any related issues
4. Wait for review

## Code of Conduct

Be respectful. Write clear code. Document your changes. Test your work.
