# 1. Base stage
FROM node:22-alpine AS server-base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.6.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm generate

# 2. Development stage
FROM server-base AS development

ENV NODE_ENV=development

EXPOSE 5000

CMD ["pnpm", "dev"]

# 3. Builder Stage
FROM server-base AS builder

ENV NODE_ENV=production

RUN pnpm run build

# 4. Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@12.6.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 5000

USER node

CMD ["node", "dist/server.js"]

# 5. Migration stage
FROM builder AS migration

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]