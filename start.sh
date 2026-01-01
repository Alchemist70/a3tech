#!/usr/bin/env bash
set -e

cd backend
echo "Checking node_modules..."
if [ ! -d "node_modules" ]; then
  echo "node_modules not found, installing..."
  npm install
else
  echo "node_modules found, verifying..."
  npm install --production
fi
echo "Starting server..."
node server.js
