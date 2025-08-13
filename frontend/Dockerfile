# ==============================================================================
# MULTI-STAGE DOCKERFILE FOR REACT FRONTEND
# ==============================================================================

# Base Node.js image
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat

# ==============================================================================
# DEPENDENCIES STAGE
# ==============================================================================
FROM base as deps

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./
COPY package.json package-lock.json* ../

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# ==============================================================================
# DEVELOPMENT STAGE
# ==============================================================================
FROM base as development

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY frontend/ .
COPY packages/ ../packages/
COPY tsconfig.json ../tsconfig.json

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# ==============================================================================
# BUILD STAGE
# ==============================================================================
FROM base as builder

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Copy shared packages
COPY ../packages ./packages

# Build the application
ENV NODE_ENV=production
RUN npm run build

# ==============================================================================
# PRODUCTION STAGE
# ==============================================================================
FROM nginx:alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
