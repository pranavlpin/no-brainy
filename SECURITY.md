# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in NoBrainy, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, please email the details to the project maintainer or use GitHub's [private vulnerability reporting](https://github.com/pranavlpin/no-brainy/security/advisories/new) feature.

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
| Latest  | Yes       |

## Security Practices

- User API keys are encrypted at rest
- Authentication via NextAuth.js with JWT sessions
- All API routes protected with auth middleware
- Database credentials stored in environment variables / GCP Secret Manager
- No secrets committed to the repository
- Input validation via Zod on all API endpoints
