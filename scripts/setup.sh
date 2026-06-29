#!/bin/bash
# Run this once after cloning to get the dev environment ready.

set -e

echo "1/4 Installing dependencies..."
pnpm install

echo "2/4 Copying .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   -> Created .env from .env.example. Fill in your values."
fi

echo "3/4 Starting Docker services (PostgreSQL, Redis, MailHog)..."
docker-compose -f docker/docker-compose.yml up -d
sleep 3

echo "4/4 Generating Prisma client and running migrations..."
pnpm --filter @velion/api exec prisma generate --schema ../../prisma/schema.prisma
pnpm --filter @velion/api exec prisma migrate dev --schema ../../prisma/schema.prisma --name init

echo ""
echo "Setup complete!"
echo ""
echo "Start dev servers:  pnpm dev"
echo "View email (MailHog): http://localhost:8025"
echo "API docs:             http://localhost:3001/api/docs"
echo "Web app:              http://localhost:3000"
