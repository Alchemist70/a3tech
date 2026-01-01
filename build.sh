#!/bin/bash

# Build script for Render deployment
# This script installs dependencies and starts the backend server

set -e

echo "Installing backend dependencies..."
cd backend
npm install

echo "Starting backend server..."
npm start
