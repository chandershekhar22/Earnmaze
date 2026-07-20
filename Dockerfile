FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS base

# Stage 1: Install ALL dependencies (for build)
FROM base AS deps
USER root
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
USER root
WORKDIR /app
# Install git (needed to clone games repo)
RUN dnf install -y git --nodocs && dnf clean all
# Clone games first so this layer is cached — only re-runs when em-games repo changes
RUN git clone --depth=1 https://gitlab.com/joshichitransh49/em-games.git static/games-repo
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
RUN mkdir -p logs \
    static/games-uploaded \
    static/artifacts-uploaded \
    static/streaks-uploaded \
    static/quizzes-uploaded \
    static/weekly-challenges-uploaded \
    static/exclusive-deals-uploaded \
    static/surveys-uploaded \
    && chmod 777 logs static/games-uploaded static/artifacts-uploaded static/streaks-uploaded \
       static/quizzes-uploaded static/weekly-challenges-uploaded static/exclusive-deals-uploaded static/surveys-uploaded
# NOTE: these directories only hold their own content when the deploy config
# (em-deploy) bind-mounts a host path over each one — see docs/setup or ask
# infra. Without that mount, every redeploy wipes uploaded artifacts/thumbnails
# because this stage always starts from an empty static/ tree.

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "build/index.js"]
