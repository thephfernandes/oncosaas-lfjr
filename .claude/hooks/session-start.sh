#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$CLAUDE_PROJECT_DIR/frontend"
npm install --legacy-peer-deps

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$CLAUDE_PROJECT_DIR/backend"
npm install

# Install AI service dependencies
echo "Installing AI service Python dependencies..."
cd "$CLAUDE_PROJECT_DIR/ai-service"
pip install -r requirements.txt

echo "All dependencies installed."
