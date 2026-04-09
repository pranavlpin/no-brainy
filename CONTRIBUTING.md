# Contributing to NoBrainy

Thank you for your interest in contributing to NoBrainy! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/pranavlpin/no-brainy/issues) to avoid duplicates
2. Open a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `feature` label
2. Describe the feature and why it would be useful
3. Include mockups or examples if possible

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Follow the coding standards** (see below)
4. **Write/update tests** for your changes
5. **Run checks** before submitting:
   ```bash
   pnpm lint
   npx tsc --noEmit
   pnpm test
   ```
6. **Commit** with conventional commit messages:
   ```
   feat(module): add new feature
   fix(module): fix bug description
   docs: update documentation
   ```
7. **Open a Pull Request** against `main` with:
   - Clear description of changes
   - Link to related issue(s)
   - Screenshots for UI changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/no-brainy.git
cd no-brainy

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your local database credentials

# Run database migrations
npx prisma migrate dev

# Seed test data (optional)
npx prisma db seed

# Start development server
pnpm dev
```

## Coding Standards

### TypeScript
- Strict mode — no `any` types
- All functions must have explicit return types
- Interfaces preferred over type aliases for object shapes

### React
- Functional components only
- Custom hooks for shared logic (prefix with `use`)
- Props interfaces named `{ComponentName}Props`

### Naming
- **Files**: `kebab-case.ts` / `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Git
- Branch naming: `feature/description` or `fix/description`
- Conventional commit messages
- One logical change per commit
- Keep PRs focused — one feature/fix per PR

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
├── components/             # React components (organized by feature)
│   ├── ui/                 # Reusable UI primitives
│   └── [feature]/          # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities, types, validations
└── stores/                 # Zustand state stores
```

## License

By contributing, you agree that your contributions will be licensed under the [GPL-3.0 License](LICENSE).
