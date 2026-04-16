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
- [Scalar](https://scalar.com) — API docs

**Shared** (`packages/core`)

- [openapi-typescript](https://openapi-ts.dev) — generates TypeScript types from FastAPI's OpenAPI schema
- [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) — fully typed API client

**Monorepo & Tooling**

- [Moon](https://moonrepo.dev) — task runner & monorepo orchestration
- [Proto](https://moonrepo.dev/proto) — toolchain version management
- [pnpm](https://pnpm.io) — JavaScript package manager
- [uv](https://docs.astral.sh/uv) — Python package manager
- [Biome](https://biomejs.dev) — JavaScript/TypeScript linter & formatter (root-level, shared across all JS/TS projects)
- [Lefthook](https://lefthook.dev) — Git hooks
- [commitlint](https://commitlint.js.org) — commit message linting

## Prerequisites

Install [Proto](https://moonrepo.dev/docs/proto/install) — it manages all other tool versions automatically:

```bash
curl -fsSL https://moonrepo.dev/install/proto.sh | bash
```

Proto will handle Node.js, pnpm, Python, and Moon based on `.prototools`.

## Getting Started

### Clone the repo

```bash
git clone https://github.com/qalbwise/app.git qalbwise

# Or if you have SSH access
git clone git@github.com:qalbwise/app.git qalbwise
```

### Move into the project directory

```bash
cd qalbwise
```

### Install dependencies and set up Git hooks

```bash
# Install JS dependencies
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

API docs are available at `http://localhost:8000/scalar`.

## Project Structure

```
my-project/
├── .moon/
│   ├── workspace.yml         # Project locations & Moon config
│   └── toolchains.yml        # Language & tool versions
├── apps/
│   ├── web/                  # React frontend
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (components + hooks)
│   │   │   ├── routes/       # TanStack file-based routes
│   │   │   └── lib/
│   │   │       └── api.ts    # Singleton API client (from @repo/core)
│   │   └── moon.yml
│   └── api/                  # FastAPI backend
│       ├── app/
│       │   ├── api/          # Routes & serializers (Pydantic schemas)
│       │   ├── modules/      # Business logic (services)
│       │   ├── models/       # SQLAlchemy models
│       │   └── core/         # Settings, logging, celery
│       ├── alembic/          # Database migrations
│       └── moon.yml
├── packages/
│   └── core/                 # Shared typed API client
│       └── src/
│           ├── api/          # Feature API methods
│           ├── client.ts     # createApi() factory
│           ├── schema.d.ts   # Auto-generated from /openapi.json (gitignored)
│           └── index.ts
├── .prototools               # Pinned tool versions
├── biome.json                # Shared Biome config (root-level)
├── commitlint.config.ts      # Commit message rules
├── docker-compose.yml        # Local/staging services
├── lefthook.yml              # Git hook definitions
├── package.json
└── pnpm-workspace.yaml
```

## Common Tasks

### Frontend

```bash
moon run web:dev          # Dev server
moon run web:build        # Production build
moon run web:lint         # Lint with Biome
moon run web:format       # Format with Biome
moon run web:check        # Lint + format + fix with Biome
moon run web:typecheck    # TypeScript type checking
```

### Backend

```bash
moon run api:dev          # Dev server
moon run api:lint         # Lint with Ruff
moon run api:format       # Format with Ruff
moon run api:migrate      # Run Alembic migrations
moon run api:worker       # Start Celery worker
```

### Shared package

```bash
moon run core:generate    # Regenerate TypeScript types from OpenAPI schema
moon run core:typecheck   # Type check packages/core
```

### Whole monorepo

```bash
moon run :lint            # Lint all projects
moon run :format          # Format all projects
moon run :check           # Check all JS/TS projects
```

## Type-Safe API

TypeScript types in `packages/core` are auto-generated from FastAPI's OpenAPI schema. Run this whenever you change a Pydantic schema:

```bash
# API must be running
moon run core:generate
```

## Database Migrations

```bash
# Apply all pending migrations
moon run api:migrate

# Create a new migration (from apps/api)
cd apps/api
uv run alembic revision --autogenerate -m "add users table"
```

Always import new models in `alembic/env.py` for autogenerate to detect them.

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable            | Description                      |
| ------------------- | -------------------------------- |
| `VITE_API_URL`      | Backend API base URL             |
| `DATABASE_URL`      | PostgreSQL connection string     |
| `REDIS_URL`         | Redis connection string          |
| `SECRET_KEY`        | Application secret key           |
| `POSTGRES_USER`     | DB user (used by Docker Compose) |
| `POSTGRES_PASSWORD` | DB password                      |
| `POSTGRES_DB`       | DB name                          |
| `OPENAI_API_KEY`    | OpenAI API key                   |

For local development without Docker, copy the relevant variables to each app's `.env`:
- `apps/api/.env` for backend
- `apps/web/.env` for frontend

For Docker deployment, the root `.env` is used automatically.

## Git Workflow

This project enforces [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <description>
```

Valid types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `revert` `ci`

```bash
git commit -m "feat(web/auth): add JWT refresh token"
git commit -m "fix(api/users): resolve null pointer in user endpoint"
git commit -m "chore: bump dependencies"
```

The `pre-commit` hook automatically runs Biome (JS/TS) and Ruff (Python) on staged files. The `commit-msg` hook validates the commit message format.

## Boilerplate Inspirations

- [indrazm/moonrepo-kickstart](https://github.com/indrazm/moonrepo-kickstart)
- [zero-one-group/monorepo](https://github.com/zero-one-group/monorepo)
