#!/bin/sh
set -e

# Set default ports if not provided via environment variables
export PORT=${PORT:-8080}
export QUARKUS_HTTP_PORT=${QUARKUS_HTTP_PORT:-8081}

# Substitute variables in the nginx configuration
envsubst '$PORT $QUARKUS_HTTP_PORT' < /etc/nginx/conf.d/default.conf \
  > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# Start the backend and nginx
echo "Starting Quarkus backend on port $QUARKUS_HTTP_PORT..."
java -jar /app/backend/quarkus-run.jar &

echo "Starting nginx on port $PORT..."
echo "Nginx config:"
cat /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
