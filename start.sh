#!/usr/bin/env bash
set -e

# Choose the backend directory that already has installed dependencies if possible.
# This avoids reinstalling during start and prevents mismatches between build
# and runtime paths (Render places the repo under /opt/render/project/src).
if [ -d "backend/node_modules" ]; then
  echo "Using backend directory with existing node_modules"
  cd backend
elif [ -d "src/backend/node_modules" ]; then
  echo "Using src/backend directory with existing node_modules"
  cd src/backend
elif [ -d "backend" ]; then
  echo "Using backend directory (no node_modules found)"
  cd backend
elif [ -d "src/backend" ]; then
  echo "Using src/backend directory (no node_modules found)"
  cd src/backend
else
  echo "Error: Cannot find backend directory"
  exit 1
fi

# Install production dependencies only if they are missing
if [ ! -d "node_modules" ]; then
  echo "$(date +'%Y-%m-%d %H:%M:%S') - node_modules not found; installing production dependencies..."
  npm ci --production --no-audit --no-fund --no-optional --prefer-offline --progress=false
  install_status=$?
  echo "$(date +'%Y-%m-%d %H:%M:%S') - npm ci exit status: $install_status"
  if [ $install_status -ne 0 ]; then
    echo "npm ci failed with status $install_status"
    exit $install_status
  fi
else
  echo "$(date +'%Y-%m-%d %H:%M:%S') - node_modules found; skipping install"
fi

# Ensure a PORT is set for platforms that may not provide one at build time.
# Render provides $PORT at runtime; default to 10000 for debugging if unset.
if [ -z "$PORT" ]; then
  export PORT=10000
  echo "PORT was unset; defaulting to $PORT"
else
  echo "PORT is set to $PORT"
fi

echo "Starting server..."
node server.js
