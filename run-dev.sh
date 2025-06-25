#!/bin/bash
# Starts backend and frontend servers for development.
# Requires Maven and Node.js installed locally.

# Load environment variables from frontend/.env if present
if [ -f frontend/.env ]; then
  set -a
  . ./frontend/.env
  set +a
fi

mvn -f backend/pom.xml quarkus:dev &
backend_pid=$!

npm --prefix frontend start &
frontend_pid=$!

trap 'kill $backend_pid $frontend_pid' INT TERM
wait $backend_pid $frontend_pid
