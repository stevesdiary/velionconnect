# syntax=docker/dockerfile:1
#
# Build context MUST be the monorepo root, e.g.:
#   docker build -f apps/api/Dockerfile -t velionconnect-api .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ---- Prune the workspace down to what @velion/api needs ----
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @velion/api --docker

# ---- Install deps, generate the Prisma client, build, strip devDependencies ----
FROM base AS build
ENV HUSKY=0
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY prisma ./prisma

RUN pnpm --filter @velion/api run prisma:generate
RUN pnpm turbo run build --filter=@velion/api...
RUN pnpm prune --prod --no-optional

# ---- Minimal runtime image ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=nestjs:nodejs /app /app

USER nestjs
WORKDIR /app/apps/api
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
