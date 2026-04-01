#!/bin/sh
set -e

# If a command was passed (e.g. docker compose run backend npx prisma migrate deploy),
# execute it directly without running the server startup sequence
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

echo "Checking pending migrations..."
npx prisma migrate status

echo "Starting server..."
exec node dist/src/main
