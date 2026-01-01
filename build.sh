#!/usr/bin/env bash
set -e

echo "Installing backend dependencies..."
cd backend
npm install

echo "Starting backend server..."
export NODE_PATH=./node_modules:$NODE_PATH
node server.js
