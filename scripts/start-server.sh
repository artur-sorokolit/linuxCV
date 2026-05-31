#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLIENT_ENV="$PROJECT_DIR/client/.env"
SERVER_DIR="$PROJECT_DIR/server"
TUNNEL_LOG="/tmp/cloudflared-linuxcv.log"

echo "🚀 Starting LinuxCV server + tunnel..."

# 1. Start the server in the background
echo "📦 Starting server..."
cd "$SERVER_DIR" && npm run dev &
SERVER_PID=$!
sleep 3

# 2. Start cloudflared tunnel and capture the URL
echo "🌐 Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:5000 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for the tunnel URL to appear in logs
echo "⏳ Waiting for tunnel URL..."
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to get tunnel URL after 30s"
  kill $SERVER_PID $TUNNEL_PID 2>/dev/null
  exit 1
fi

echo "✅ Tunnel URL: $TUNNEL_URL"

# 3. Update client .env with the new tunnel URL
if grep -q "VITE_API_URL" "$CLIENT_ENV" 2>/dev/null; then
  sed -i "s|VITE_API_URL=.*|VITE_API_URL=$TUNNEL_URL|" "$CLIENT_ENV"
else
  echo "VITE_API_URL=$TUNNEL_URL" >> "$CLIENT_ENV"
fi
echo "📝 Updated client/.env with VITE_API_URL=$TUNNEL_URL"

# 4. Rebuild and deploy client
echo "🔨 Building and deploying client..."
cd "$PROJECT_DIR" && make deploy

echo ""
echo "============================================"
echo "✅ Everything is running!"
echo "   Server:  http://localhost:5000"
echo "   Tunnel:  $TUNNEL_URL"
echo "   Client deployed with new API URL"
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
