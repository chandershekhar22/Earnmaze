FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS base

# Stage 1: Install ALL dependencies (for build)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p ./logs
RUN npm run build

# Stage 3: Production dependencies only
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 4: Production server
FROM base AS runner
WORKDIR /app
RUN mkdir -p logs && chmod 777 logs
ENV NODE_ENV=production

# Only copy what's needed at runtime
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "build/index.js"]
