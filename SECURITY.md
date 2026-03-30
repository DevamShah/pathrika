# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Pathrika, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email:** Send details to the repository owner via GitHub's private vulnerability reporting feature
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix or mitigation:** Within 30 days for critical/high severity

### Scope

The following are in scope:
- SQL injection via search or feed parameters
- XSS via RSS feed content (sanitization bypass)
- SSRF via feed URL configuration
- Authentication/authorization bypass
- Information disclosure
- Dependency vulnerabilities (HIGH/CRITICAL)

The following are out of scope:
- Self-hosted instance misconfigurations
- Denial of service via feed URL flooding (rate limiting is the operator's responsibility)
- Vulnerabilities in upstream RSS feed content

## Security Architecture

### Input Sanitization

All RSS feed content is sanitized using `sanitize-html` before storage and display:
- Allowed tags: `p`, `br`, `b`, `i`, `em`, `strong`, `a`, `ul`, `ol`, `li`, `blockquote`
- Allowed attributes: `a[href, target]` only
- All other HTML is stripped

### Feed URL Handling

- Feed URLs are statically configured in `api/src/lib/feeds.ts`
- No user-supplied feed URLs are accepted via the API (SSRF prevention)
- HTTP requests to feeds include a fixed User-Agent header
- Connection timeout: 15 seconds per feed

### Database Security

- Parameterized queries via Drizzle ORM (SQL injection prevention)
- Search uses parameterized `ILIKE` — no raw string interpolation
- Database credentials are environment variables, never hardcoded

### Caching

- Redis is used for caching only — no sensitive data stored
- Cache keys are deterministic (feed ID based), not user-controlled

### Content Security

- No user authentication (read-only aggregator)
- No cookies or session tokens
- External article links open in new tabs with `rel="noopener noreferrer"`
- Images loaded with `loading="lazy"` and error fallback handlers

## Automated Security Checks

The following tools run as part of the quality gate:

| Tool | Check | Frequency |
|------|-------|-----------|
| gitleaks | Secret detection in source code | Every commit (pre-commit hook) |
| trivy | Dependency vulnerability scan (HIGH/CRITICAL) | Every quality gate |
| semgrep | Static analysis (OWASP patterns) | Every quality gate |
| TypeScript strict mode | Type safety enforcement | Every commit |

## Dependencies

Dependencies are locked via `package-lock.json`. Regular updates should be applied via:

```bash
cd api && npm audit fix
cd web && npm audit fix
```
