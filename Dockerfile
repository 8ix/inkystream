# Multi-stage build for Raspberry Pi (arm64/armv7) and generic Linux
# Stage 1: Builder
FROM node:20-slim AS builder

# Install build deps (sharp needs libvips, build-essentials)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libc6 \
    libvips-dev \
    git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install runtime deps for sharp
RUN apt-get update && apt-get install -y \
    libc6 \
    libvips \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install prod deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/config ./config
# Images directory can be mounted as a volume; copy if exists
COPY --from=builder /app/images ./images
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
