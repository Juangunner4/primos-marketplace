#!/bin/sh
set -e
export QUARKUS_HTTP_PORT=${QUARKUS_HTTP_PORT:-8081}
java -jar /app/backend/quarkus-run.jar &
exec nginx -g 'daemon off;'
