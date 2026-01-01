#!/usr/bin/env bash
set -e

echo "Installing backend dependencies..."
cd backend
npm install

echo "Starting backend server..."
node server.js
