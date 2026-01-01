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
  echo "node_modules not found; installing production dependencies..."
  npm ci --production
else
  echo "node_modules found; skipping install"
fi

echo "Starting server..."
node server.js
