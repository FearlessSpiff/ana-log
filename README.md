# ana-log

A small web app for logging the shots you take on analog cameras: film, camera,
lens, aperture, shutter speed, location and notes per frame.

- **Works offline.** Everything is stored on the device first (IndexedDB) and
  synced to the server when there is a connection. Install it to your home
  screen as a PWA.
- **Google sign-in only**, optionally restricted to a list of accounts.
- **Self-hosted**: one Docker container running [PocketBase](https://pocketbase.io),
  which stores the data in SQLite and serves the app.

## Stack

| Part     | Tech                                                          |
| -------- | ------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, vite-plugin-pwa, Dexie (IndexedDB)   |
| Backend  | PocketBase (collections in `pb/pb_migrations`, hooks in `pb/pb_hooks`) |
| Deploy   | Docker Compose behind nginx with Let's Encrypt                |

Data model: **cameras**, **lenses** and **films** (your gear), **rolls** (a film
loaded in a camera) and **frames** (one exposure on a roll). Every record
belongs to a user; PocketBase rules only let users read and write their own.

## Deploy

### 1. Google OAuth client

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   and create a project if needed.
2. Configure the OAuth consent screen (External, add your email as test user
   or publish it).
3. Create credentials → **OAuth client ID** → *Web application*.
4. Authorized redirect URI: `https://YOUR_DOMAIN/api/oauth2-redirect`
5. Copy the client ID and secret.

### 2. Run the container

```sh
git clone https://github.com/FearlessSpiff/ana-log.git
cd ana-log
cp .env.example .env   # fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, ALLOWED_EMAILS
docker compose up -d --build
```

The app listens on `127.0.0.1:8090`. Data lives in `./pb_data`; back up that
folder.

Google login is configured from `.env` on every start. Create an admin account
for the PocketBase dashboard (`https://YOUR_DOMAIN/_/`):

```sh
docker compose exec ana-log /pb/pocketbase superuser upsert you@example.com 'a-long-password' --dir /pb/pb_data
```

### 3. nginx

Copy [`deploy/nginx.conf`](deploy/nginx.conf), replace the domain and run
`certbot --nginx -d YOUR_DOMAIN`. Keep `proxy_buffering off`: the Google
login waits for its result on a streaming connection.

### Update

```sh
git pull && docker compose up -d --build
```

## Develop

Quickest way, no Docker or Google needed:

```sh
./dev.sh
```

It downloads PocketBase into `.dev/`, starts it with `DEV_MODE=1` and runs the
Vite dev server. Open http://localhost:5173 and click **Dev login** (test user
`dev@ana-log.local` / `devpassword`). Local data lives in `.dev/pb_data`; delete
that folder to start over. The dev login button only exists in the dev server,
never in production builds.

To test real Google login locally instead:

```sh
# Terminal 1: PocketBase (download the binary from the releases page)
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
  ./pocketbase serve --dir pb/pb_data --migrationsDir pb/pb_migrations --hooksDir pb/pb_hooks

# Terminal 2: frontend on http://localhost:5173, proxies /api to PocketBase
cd web && npm install && npm run dev
```

For local Google login, also add `http://localhost:5173/api/oauth2-redirect`
as a redirect URI on the OAuth client.

## How sync works

Records get client-generated ids, so they can be created offline. Local changes
are flagged dirty and pushed (update, or create if the server doesn't have the
record yet); then everything changed on the server since the last sync is
pulled. Deletes are soft (`deleted = true`) so they reach other devices. If the
same record is edited on two devices before syncing, the last push wins.
