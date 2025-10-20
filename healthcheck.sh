#!/bin/bash

PORT=${1:-8000}
TIMEOUT=5  # Lower timeout for curl requests

echo "Checking health on port: $PORT"

# Use timeout flag with curl to prevent hanging
http_response=$(curl --max-time $TIMEOUT -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health || echo "000")

if [ "$http_response" = "500" ]; then
  echo "Health check failed: Server error (HTTP 500) on port $PORT"
  exit 1
elif [ "$http_response" = "000" ]; then
  echo "Health check failed: Server unreachable or connection timeout on port $PORT"
  exit 1
fi

echo "Service on port $PORT is healthy (HTTP $http_response)"
exit 0