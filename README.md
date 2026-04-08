# Qalbwise

> Qalbwise lets you type anything on your mind and instantly discover what the Quran says about it — accurately, contextually, and personally.

## Tech Stack

**Frontend** (`apps/web`)
- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) — build tool
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [shadcn/ui](https://ui.shadcn.com) — component library
- [TanStack](https://tanstack.com) — Router, Query, Table

**Backend** (`apps/api`)
- [FastAPI](https://fastapi.tiangolo.com) — API framework
- [Alembic](https://alembic.sqlalchemy.org) — database migrations
- [Celery](https://docs.celeryq.dev) + Redis — background task queue
- [Ruff](https://docs.astral.sh/ruff) — linter & formatter
- [Loguru](https://loguru.readthedocs.io) — logging

**Monorepo & Tooling**
- [Moon](https://moonrepo.dev) — task runner & monorepo orchestration
- [Proto](https://moonrepo.dev/proto) — toolchain version management
- [pnpm](https://pnpm.io) — JavaScript package manager
- [uv](https://docs.astral.sh/uv) — Python package manager
- [Biome](https://biomejs.dev) — JavaScript/TypeScript linter & formatter
- [Lefthook](https://lefthook.dev) — Git hooks
- [commitlint](https://commitlint.js.org) — commit message linting

## Prerequisites

- [Proto](https://moonrepo.dev/docs/proto/install) — installs all other tool versions automatically

```bash
curl -fsSL https://moonrepo.dev/install/proto.sh | bash
```

Once Proto is installed, it will handle Node.js, pnpm, Python, and Moon automatically based on `.prototools`.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/qalbwise/app.git
cd my-project

# Install JS dependencies and set up Git hooks
pnpm install

# Install Python dependencies
uv sync --project apps/api
```

## Running the Project

```bash
# Start the frontend dev server
moon run web:dev

# Start the backend dev server
moon run api:dev

# Start both simultaneously
moon run web:dev api:dev

# Start the Celery worker
moon run api:worker
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:8000`.  
API docs are available at `http://localhost:8000/docs`.

## Common Tasks

### Frontend

```bash
moon run web:build      # Production build
moon run web:lint       # Lint with Biome
moon run web:format     # Format with Biome
moon run web:typecheck  # TypeScript type checking
```

### Backend

```bash
moon run api:lint       # Lint with Ruff
moon run api:format     # Format with Ruff
moon run api:migrate    # Run Alembic migrations
```

### Run across the whole monorepo

```bash
moon run :lint    # Lint all projects
moon run :format  # Format all projects
```

## Database Migrations

```bash
# Apply all pending migrations
moon run api:migrate

# Create a new migration (run from apps/api)
cd apps/api
uv run alembic revision --autogenerate -m "your migration description"
```

## Environment Variables

Copy the example env file and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (used by Celery) |
| `SECRET_KEY` | Application secret key |

## Git Workflow

This project enforces [Conventional Commits](https://www.conventionalcommits.org). Every commit message must follow this format:

```
<type>(<optional scope>): <description>
```

**Valid types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`

**Examples:**
```bash
git commit -m "feat(api/auth): add JWT refresh token"
git commit -m "fix(api): resolve null pointer in user endpoint"
git commit -m "chore: bump dependencies"
```

The `pre-commit` hook automatically runs Biome (frontend) and Ruff (backend) on staged files before each commit. The `commit-msg` hook validates the commit message format.

## Project Structure

```
my-project/
├── .moon/
│   ├── workspace.yml       # Project locations & Moon config
│   └── toolchains.yml      # Language & tool versions
├── apps/
│   ├── web/                # React frontend
│   │   ├── src/
│   │   ├── moon.yml
│   │   └── package.json
│   └── api/                # FastAPI backend
│       ├── app/
│       ├── alembic/
│       ├── moon.yml
│       └── pyproject.toml
├── .prototools             # Pinned tool versions
├── commitlint.config.ts    # Commit message rules
├── lefthook.yml            # Git hook definitions
├── package.json
└── pnpm-workspace.yaml
```
