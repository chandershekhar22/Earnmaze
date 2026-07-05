FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS base

# Stage 1: Install ALL dependencies (for build)
# Build stages run as root: buildah/podman create WORKDIR owned by root while the
# UBI image's default user is 1001, so `npm ci` would fail with EACCES. (Docker
# BuildKit chowns WORKDIR to the image user, which is why it built on the laptop.)
FROM base AS deps
USER root
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
USER root
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p ./logs
RUN npm run build

# Stage 3: Production dependencies only
FROM base AS prod-deps
USER root
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 4: Production server
FROM base AS runner
USER root
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed at runtime
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/scripts ./scripts

# Own the app tree as the non-root runtime user (uid 1001, gid 0 — the
# OpenShift/UBI convention) so the app can create logs and write uploads.
RUN mkdir -p logs && chown -R 1001:0 /app && chmod -R g+rwX /app

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
USER 1001
CMD ["node", "build/index.js"]
