#!/bin/bash
set -e

echo "Using backend directory"
cd backend

echo "Starting backend server..."
node server.js
