#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$PROJECT_DIR/server"

# Change this to your tunnel name (from 'cloudflared tunnel create')
TUNNEL_NAME="linuxcv-api"

echo "🚀 Starting LinuxCV server + Cloudflare tunnel..."

# 1. Start the server in the background
echo "📦 Starting server..."
cd "$SERVER_DIR" && npm run dev &
SERVER_PID=$!
sleep 3

# 2. Start the named tunnel
echo "🌐 Starting Cloudflare tunnel ($TUNNEL_NAME → api.artur-sorokolit.uk)..."
cloudflared tunnel --url http://localhost:5000 run "$TUNNEL_NAME" &
TUNNEL_PID=$!

echo ""
echo "============================================"
echo "✅ Everything is running!"
echo "   Server:  http://localhost:5000"
echo "   API:     https://api.artur-sorokolit.uk"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop everything"

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  kill $SERVER_PID $TUNNEL_PID 2>/dev/null
  wait $SERVER_PID $TUNNEL_PID 2>/dev/null
  echo "👋 Done"
}
trap cleanup EXIT INT TERM

# Wait for processes
wait $SERVER_PID $TUNNEL_PID
