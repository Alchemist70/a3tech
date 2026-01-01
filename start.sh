#!/bin/bash
set -e

echo "Using backend directory"
cd backend

# Install production dependencies only if missing (keeps start.sh long-running)
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

echo "Starting backend server..."
node server.js
