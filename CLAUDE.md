# ana-log

Offline-first PWA for logging analog photos (rolls, frames, cameras, lenses,
films). React + Vite frontend in `web/`, PocketBase backend in `pb/`, shipped
as one Docker container. See README.md for user-facing setup.

## Layout

- `web/src/db.ts`: Dexie (IndexedDB) schema and record types; `save()`/`remove()` mark records dirty.
- `web/src/sync.ts`: push dirty records (update, else create), then pull by `updated` cursor.
- `web/src/lib.ts`: constants (apertures, shutters, camera types, film colors, themes) and helpers.
- `web/src/components/Icons.tsx`: camera/lens/film SVG icons.
- `pb/pb_migrations/`: collections; applied automatically on PocketBase start.
- `pb/pb_hooks/config.pb.js`: Google OAuth from env, `ALLOWED_EMAILS`, `DEV_MODE` test user.
- `dev.sh`: local dev without Docker or Google.

## Changing the data model

Adding a field needs all of:
1. a new migration in `pb/pb_migrations/` (never edit applied ones),
2. the field on the type in `web/src/db.ts`,
3. the form/UI. Sync copies all fields automatically.

Records use client-generated 15 char ids, references between records are plain
text ids (not PocketBase relations) and deletes are soft (`deleted = true`).
Keep it that way, offline sync depends on it.

## Checks

```sh
cd web && npm run lint && npm run build
```

There are no automated tests. Migrations can be checked against a scratch dir:
`.dev/pocketbase migrate up --dir /tmp/pbtest --migrationsDir pb/pb_migrations`.

## Production deployment (not done yet)

Target: the user's own server with Docker, nginx and Let's Encrypt. Steps are in
README.md ("Deploy"). Checklist:

- [ ] Google OAuth client with redirect URI `https://DOMAIN/api/oauth2-redirect`.
- [ ] `.env` from `.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `APP_URL`, and `ALLOWED_EMAILS` (otherwise any Google account can sign up).
- [ ] `docker compose up -d --build`; app on `127.0.0.1:8090`, data in `./pb_data`.
- [ ] Create a real admin: `docker compose exec ana-log /pb/pocketbase superuser upsert EMAIL PASS --dir /pb/pb_data`.
- [ ] nginx site from `deploy/nginx.conf` + `certbot --nginx -d DOMAIN`.
- [ ] Sign in with Google on desktop and phone, log a frame offline, check it syncs.
- [ ] Back up `pb_data/` regularly.

Never set `DEV_MODE=1` in production: it enables password login with the
publicly known test user `dev@ana-log.local` / `devpassword`.

Known risks on first deploy:
- The Docker image has never been built (no Docker on the dev machine).
  `TARGETARCH` must match a PocketBase release (`amd64`, `arm64`).
- Google login has never run end to end. It waits on the `/api/realtime` SSE
  stream, so nginx needs `proxy_buffering off` (already in `deploy/nginx.conf`).
- The UI has only been tried in the local dev server. The production build
  (service worker, offline mode, install to home screen) hasn't run on a phone yet.

PocketBase version is pinned in two places: `Dockerfile` (`PB_VERSION`) and `dev.sh`.
