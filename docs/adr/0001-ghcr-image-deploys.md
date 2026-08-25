# Deploy via GHCR images, thin VM

The VM no longer builds images from source. GitHub Actions builds `qalbwise/app` images on a runner, pushes them to GHCR, then SSHes in and runs `docker compose pull && docker compose up -d`. The VM keeps only a `docker-compose.yml` and a gitignored `.env`; it has no source checkout and never runs a build.

We chose this over building on the VM because it makes the deploy artifact identical to what CI tested, removes build tooling and source from the host, and makes rollback a matter of pulling a previous tag. The cost: web build-time env (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`) is baked into the image, so changing it requires a rebuild + push rather than a `.env` edit on the VM.

- **Trigger**: push to `main`
- **Images**: `ghcr.io/qalbwise/app/api:main` (one image; compose `command:` selects api vs worker) and `ghcr.io/qalbwise/app/web:main`
- **Tags**: each push also tags images with `:sha-<shortsha>` (immutable). The VM's compose file references `${IMAGE_TAG:-main}`; normal deploys use `main`, rollback is `IMAGE_TAG=sha-abc1234 docker compose pull && docker compose up -d`
- **Runtime env**: `.env` lives on the VM, placed once, gitignored
- **Migrations**: run on api container start (`alembic upgrade head`), as before. Rollback is code-only: if a deploy ran a migration, that deploy is forward-only (no DB downgrade)
- **Build scope**: both images built every push
- **Rollout**: `docker compose pull && docker compose up -d`
- **Auth**: `GITHUB_TOKEN` (`packages: write`) for push; PAT (`read:packages`) on the VM for pull
- **Web build env**: `VITE_*` values live in GitHub secrets, passed as build-args in the workflow
