#!/usr/bin/env bash
set -e

# Handle both local and Render deployment paths
if [ -d "src/backend" ]; then
  echo "Using src/backend directory"
  cd src/backend
elif [ -d "backend" ]; then
  echo "Using backend directory"
  cd backend
else
  echo "Error: Cannot find backend directory"
  exit 1
fi

echo "Installing dependencies (clean install)..."
npm ci --production
echo "Starting server..."
node server.js
