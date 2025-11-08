#!/bin/sh

cat > /usr/share/nginx/html/env.js <<EOF
window.VITE_API_URL = "${VITE_API_URL:-http://localhost:8000}";
window.VITE_JWT_EXPIRES_IN = ${VITE_JWT_EXPIRES_IN:-1296000};
EOF

echo "Generated env.js with runtime environment variables:"
cat /usr/share/nginx/html/env.js

exec "$@"
