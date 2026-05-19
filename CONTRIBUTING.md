# Contributing to Qalbwise

Thank you for your interest in contributing. This guide covers the social and process side of contributing. For technical standards — architecture, coding conventions, code patterns, and commands — see [AGENTS.md](AGENTS.md).

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org). By participating, you agree to maintain a respectful, inclusive, and harassment-free environment. Report unacceptable behavior to [up2dul@gmail.com](mailto:up2dul@gmail.com).

---

## Getting Started

1. Install [Proto](https://moonrepo.dev/docs/proto/install) — it manages Node.js, pnpm, Python, and Moon via `.prototools`
2. Clone the repo: `git clone git@github.com:qalbwise/app.git qalbwise`
3. Install dependencies:
   - `pnpm install` — JavaScript
   - `uv sync --project apps/api` — Python
   - `pnpm prepare` — Git hooks
4. Create a `.env` file from `.env.example`
5. Start infrastructure: `docker compose up -d`
6. Start dev servers: `moon run web:dev` and `moon run api:dev`

See [AGENTS.md](AGENTS.md) for all commands, environment variables, and project structure.

---

## Development Workflow

### Branching

Branch from `main` with descriptive names:

- `feat/web/ayah-search`
- `fix/api/user-null-pointer`
- `chore/upgrade-deps`

Keep branches short-lived and rebase onto `main` before opening a PR.

### Commit Messages

This project enforces [Conventional Commits](https://www.conventionalcommits.org) via Lefthook + commitlint:

```
<type>(<optional scope>): <lowercase description>
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`

```
feat(web/auth): add JWT refresh token
fix(api/users): resolve null pointer in profile endpoint
chore: bump dependencies
```

Scope references the workspace (`web`, `api`, `core`). Subject must be lowercase, under 100 characters, no period.

### Opening a Pull Request

1. Push your branch and open a PR against `main`
2. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
3. Ensure CI passes (lint, format, typecheck)
4. Request review from a maintainer
5. Address feedback with fixup commits; squash before merge

---

## Reporting Issues

Use the [issue templates](.github/ISSUE_TEMPLATE/). For bug reports, include steps to reproduce, expected vs actual behavior, and environment details. For feature requests, describe the problem you're solving and your proposed solution.

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
