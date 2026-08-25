# VM Setup (one-time)

The VM is a thin runtime host: it holds only `docker-compose.yml` and a gitignored `.env`, and pulls images from GHCR. It has no source checkout and never builds images.

## Prerequisites

- Docker + Docker Compose installed on the VM
- The deploy user can run `docker` (or is in the `docker` group)
- A GitHub Personal Access Token (PAT) with `read:packages` scope

## 1. Create the app directory

```bash
sudo mkdir -p /home/deploy/apps/qalbwise
sudo chown -R deploy:deploy /home/deploy/apps
```

## 2. Authenticate to GHCR

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin
```

`~/.docker/config.json` now holds the credential; `docker compose pull` uses it automatically.

## 3. Place the files

Copy `docker-compose.yml` from this repo onto the VM:

```bash
scp docker-compose.yml deploy@<host>:/home/deploy/apps/qalbwise/
```

Create the `.env` file on the VM (gitignored, never committed):

```bash
# /home/deploy/apps/qalbwise/.env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=qalbwise
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/qalbwise
REDIS_URL=redis://redis:6379/0
SECRET_KEY=...
OPENAI_API_KEY=...
GOOGLE_CLIENT_ID=...
QF_CLIENT_ID=...
QF_CLIENT_SECRET=...
QF_AUTH_BASE_URL=...
QF_API_BASE_URL=...
QF_REDIRECT_URI=...
QF_MUSHAF_ID=...
FRONTEND_URL=...
```

Note: `db` and `redis` are not built or pulled — they are plain images (`postgres:16-alpine`, `redis:7-alpine`).

## 4. First start

```bash
cd /home/deploy/apps/qalbwise
docker compose up -d
```

The api container runs `alembic upgrade head` on start; the web container serves the SPA built with the `VITE_*` build args baked in by CI.

## Deploy

The GitHub Actions workflow (`deploy.yml`) builds and pushes images on every push to `main`, then runs:

```bash
docker compose pull
docker compose up -d
```

## Rollback

Every push tags images with both `:main` (mutable) and `:sha-<shortsha>` (immutable). To roll back to a previous build:

```bash
IMAGE_TAG=sha-abc1234 docker compose pull
IMAGE_TAG=sha-abc1234 docker compose up -d
```

Rollback is code-only: if the deploy you are rolling back ran a DB migration, that deploy is forward-only (no `alembic downgrade`). Migrations run on api container start.
