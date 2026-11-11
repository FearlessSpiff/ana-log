#!/usr/bin/env bash
# Run ana-log locally without Docker or Google: PocketBase in DEV_MODE on
# :8090 plus the Vite dev server on http://localhost:5173.
set -euo pipefail
cd "$(dirname "$0")"

PB_VERSION=0.40.6
DEV_DIR=.dev

if [[ ! -x $DEV_DIR/pocketbase ]]; then
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  case $(uname -m) in
    x86_64) arch=amd64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
  esac
  echo "Downloading PocketBase $PB_VERSION ($os/$arch)…"
  mkdir -p $DEV_DIR
  curl -fsSL -o $DEV_DIR/pb.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${os}_${arch}.zip"
  unzip -o -q $DEV_DIR/pb.zip pocketbase -d $DEV_DIR
  rm $DEV_DIR/pb.zip
fi

[[ -d web/node_modules ]] || (cd web && npm install)

# Without a superuser PocketBase opens its installer page in the browser on
# every start, so create a fixed dev admin up front.
$DEV_DIR/pocketbase superuser upsert admin@ana-log.local devpassword \
  --dir $DEV_DIR/pb_data --migrationsDir pb/pb_migrations >/dev/null
echo "PocketBase admin: http://127.0.0.1:8090/_/ (admin@ana-log.local / devpassword)"

DEV_MODE=1 $DEV_DIR/pocketbase serve \
  --dir $DEV_DIR/pb_data \
  --migrationsDir pb/pb_migrations \
  --hooksDir pb/pb_hooks \
  --http 127.0.0.1:8090 &
PB_PID=$!
trap 'kill $PB_PID 2>/dev/null' EXIT

cd web
npm run dev
