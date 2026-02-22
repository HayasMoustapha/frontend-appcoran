#!/usr/bin/env bash
set -euo pipefail

export VITE_DEBUG_STATS=true

echo "=== FPS profiling enabled (VITE_DEBUG_STATS=true) ==="
echo "Starting Vite dev server..."
echo "Open the app on mobile and watch console logs for FPS."
echo "Press Ctrl+C to stop."

npm run dev
