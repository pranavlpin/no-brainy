# Contributing to NoBrainy

Thank you for your interest in contributing to NoBrainy! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://github.com/pranavlpin/no-brainy/blob/main/CODE_OF_CONDUCT.md).

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

The canonical workflow is defined in [/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md](/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md), mirrored exactly in [/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md](/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md). Read it before changing the repository.

1. Create the task branch and record its target/base. Never implement directly on main.
2. Write a new implementation plan, obtain explicit approval, then append the approved module task entry. Historical plans and task/test-plan ledger sections are immutable.
3. Write and run failing tests before implementation, following the section test plan. Keep tests under the module/type directories defined in the canonical rules.
4. Implement and refactor with tests green. Preserve existing assertions, user data and unrelated changes.
5. Run formatting, strict type checking, ESLint with zero warnings/errors, the full test suite and applicable database/browser/build checks. Record unavailable gates honestly. The test foundation task establishes the executable package scripts.
6. Use logical, module-scoped imperative commits and the authorized work identity. Dependency changes need explicit approval and their own commit.
7. Push or open a PR only when instructed. A code review requires its own explicit request; merge only after review approval and explicit merge authorization.

Screenshots are captured only on explicit request. Temporary logs and artifacts belong in the Git-ignored directory `/Users/pranav/Pranav_projects/github/no-brainy/evidences/`. No evidence, secrets or environment files may be committed.

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

- Branch naming: `feature/<module>-<task>`, `bugfix/<module>-<issue>` or `test/<module>-<scope>`
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

By contributing, you agree that your contributions will be licensed under the [GPL-3.0 License](https://github.com/pranavlpin/no-brainy/blob/main/LICENSE).
