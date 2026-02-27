# Multi-stage build for Raspberry Pi (arm64/armv7) and generic Linux
# Using Alpine to avoid CVE-2023-45853 (zlib vulnerability in Debian)
# Stage 1: Builder
FROM node:20-alpine AS builder

# Cache bust arg - change value to force full rebuild
ARG CACHE_BUST=1

# Install build deps (sharp needs libvips, build tools)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    git

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install runtime deps for sharp (vips)
RUN apk add --no-cache \
    vips

WORKDIR /app

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./

# Copy public directory (not included in standalone output)
COPY --from=builder /app/public ./public

# Copy static files (not included in standalone output)
COPY --from=builder /app/.next/static ./.next/static

# Copy config directory (for build-time config, volume mount overrides at runtime)
COPY --from=builder /app/config ./config

# Create images directory for volume mount
RUN mkdir -p ./images

EXPOSE 3000

CMD ["node", "server.js"]
