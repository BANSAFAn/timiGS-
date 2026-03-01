# Docker Deployment

**TimiGS** can be deployed using Docker for a consistent and isolated environment across different platforms.

## Overview

The Docker setup uses a **multi-stage build** process:

1. **Build Stage** – Compiles the static site using Node.js
2. **Production Stage** – Serves the built files with NGINX

This approach ensures a small final image size and optimal performance.

## Prerequisites

Before you begin, make sure you have:

- **Docker** (v20.10 or later)
- **Docker Compose** (v2.0 or later)

> [!TIP]
> Docker Desktop for Windows includes Docker Compose by default.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

The easiest way to run TimiGS locally:

```bash
# Build and start the container
docker-compose up --build

# Access the website at http://localhost:8080
```

### Option 2: Using Docker CLI

```bash
# Build the image
docker build -t timigs-website .

# Run the container
docker run -d -p 8080:80 --name timigs-website timigs-website

# Access the website at http://localhost:8080
```

## Configuration

### Port Mapping

By default, the website is accessible on **port 8080**. You can change this in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Change 8080 to your desired host port
```

### Environment Variables

Currently, no environment variables are required. The container is fully self-contained.

## Dockerfile Breakdown

### Stage 1: Build

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY site/package.json site/package-lock.json* ./
RUN npm ci
COPY site/ .
RUN npm run build
```

This stage:
- Uses Node.js 20 Alpine for minimal size
- Installs dependencies from `site/package.json`
- Builds the static site using Astro

### Stage 2: Production

```dockerfile
FROM nginx:alpine AS production
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

This stage:
- Uses NGINX Alpine for serving static files
- Applies custom NGINX configuration (compression, caching, security headers)
- Copies built files from the build stage

## NGINX Configuration

The `docker/nginx.conf` includes:

| Feature | Description |
|---------|-------------|
| **Gzip Compression** | Reduces transfer size for text-based assets |
| **Static Caching** | 30-day cache for JS, CSS, images, fonts |
| **SPA Routing** | Proper fallback to `index.html` for client-side routing |
| **Security Headers** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

## Useful Commands

```bash
# View container logs
docker logs timigs-website

# Stop the container
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate

# Check container health
docker inspect --format='{{.State.Health.Status}}' timigs-website

# Access container shell (debugging)
docker exec -it timigs-website /bin/sh
```

## Health Check

The container includes a built-in health check:

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3
- **Start Period**: 5 seconds

## Production Deployment

For production use:

1. **Use a specific image tag** instead of building locally
2. **Configure HTTPS** with a reverse proxy (e.g., Traefik, Caddy)
3. **Set up logging** with a log driver
4. **Enable container restart policy**: `restart: unless-stopped`

> [!WARNING]
> The default configuration is for development/testing. For production, ensure proper SSL/TLS termination.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs timigs-website

# Verify port is not in use
netstat -ano | findstr :8080
```

### Build fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Site returns 404

Ensure the build completed successfully. Check:

```bash
docker exec timigs-website ls -la /usr/share/nginx/html
```

## File Structure

```
.
├── Dockerfile           # Multi-stage build definition
├── docker-compose.yml   # Container orchestration
├── .dockerignore        # Files excluded from build context
└── docker/
    └── nginx.conf       # NGINX server configuration
```

> [!NOTE]
> The `.dockerignore` file excludes `node_modules`, build artifacts, and platform-specific files to reduce image size.
