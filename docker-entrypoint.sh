#!/bin/sh
set -e
serve -s /app/frontend/build -l 3000 &
exec java -jar /app/backend/quarkus-run.jar
