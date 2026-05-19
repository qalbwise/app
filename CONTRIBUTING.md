# Contributing to Qalbwise

Thank you for your interest in contributing. This guide covers the social and process side of contributing. For technical standards — architecture, coding conventions, code patterns, and commands — see [AGENTS.md](AGENTS.md).

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org). By participating, you agree to maintain a respectful, inclusive, and harassment-free environment. Report unacceptable behavior to [up2dul@gmail.com](mailto:up2dul@gmail.com).

---

## General Workflow

1. Fork the repository ([Fork](https://github.com/qalbwise/app/fork)).
2. Clone your fork (`git clone git@github.com:your-username/qalbwise.git`).
3. Add the upstream remote (`git remote add upstream git@github.com:qalbwise/app.git`).
4. Create a new branch (`git checkout -b short-topic`).
5. Make your changes.
6. Run `moon run :lint && moon run :check && moon run web:typecheck && moon run core:typecheck` and fix anything that fails before opening a PR.
7. Open a pull request against this repository.

See the [README](README.md) for setup and running instructions, and [AGENTS.md](AGENTS.md) for technical patterns and conventions.

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
