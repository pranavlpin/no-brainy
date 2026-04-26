# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in NoBrainy, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, use GitHub's [private vulnerability reporting](https://github.com/pranavlpin/no-brainy/security/advisories/new) feature.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 1 week
- **Fix**: As soon as possible, depending on severity

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Yes |

## Security Practices

- User API keys (OpenAI) are encrypted at rest before storage
- Authentication via NextAuth.js with JWT sessions
- All API routes protected with `withAuth` middleware
- Database credentials stored in environment variables (never in code)
- No secrets committed to the repository (verified via secret scanning)
- Input validation via Zod schemas on all API endpoints
- HTTPS required for production deployments
- GitHub secret scanning and push protection enabled
- Dependabot alerts enabled for dependency vulnerabilities

## Self-Hosting Security

When self-hosting NoBrainy, ensure:

- **HTTPS**: Always use TLS in production (Cloud Run provides this by default)
- **Database**: Use strong passwords, restrict network access
- **Secrets**: Use environment variables or a secret manager, never hardcode
- **Updates**: Keep dependencies updated — run `pnpm audit` periodically
