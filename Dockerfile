# FisioFlow - Optimized Dockerfile for DigitalOcean App Platform
# Multi-stage build for production deployment

# Base image with Node.js 22 (LTS)
FROM node:22-alpine AS base

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    openssl \
    ca-certificates \
    dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Dependencies stage - install production dependencies
FROM base AS deps
WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies with optimizations
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# Builder stage - build the application
FROM base AS builder
WORKDIR /app

# Copy all dependencies
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy prisma schema first
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Copy production dependencies for runtime
COPY --from=deps /app/node_modules ./node_modules_prod

# Build application with optimizations
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

RUN npm run build && \
    npm prune --production

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DigitalOcean App Platform optimizations
ENV DO_APP_NAME="fisioflow"
ENV DO_REGION="nyc1"
ENV DO_ENVIRONMENT="production"

# Performance optimizations
ENV NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"
ENV UV_THREADPOOL_SIZE=4

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

# Copy prisma schema and generated client
COPY prisma ./prisma

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/tmp && \
    chown -R nextjs:nodejs /app/logs /app/tmp

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]