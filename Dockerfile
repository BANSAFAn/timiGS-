# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY site/package.json site/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source
COPY site/ .

# Build static site
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:alpine AS production

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
