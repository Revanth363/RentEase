# Docker Setup Guide

Complete Docker containerization for the FFSD (Rental Management) application with multi-stage builds and production-ready configuration.

## 📋 Overview

This Docker setup includes:
- **Backend**: Node.js Express API (port 5000)
- **Frontend**: React/Vite with Nginx (port 80)
- **MongoDB**: Document database (port 27017)
- **Redis**: Cache layer (port 6379)

All services communicate through a Docker network and include health checks for reliability.

---

## 🚀 Quick Start

### Prerequisites
- Docker: 20.10+
- Docker Compose: 2.10+
- 4GB available RAM
- 2GB available disk space

### 1. Configure Environment Variables

```bash
# Copy the template
cp .env.docker .env

# Edit with your actual values
nano .env
# or
code .env
```

**Critical environment variables to set:**
```env
JWT_SECRET=your-strong-random-64-char-string
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 2. Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **MongoDB**: mongodb://admin:admin123@localhost:27017
- **Redis**: localhost:6379 (password: redis123)

---

## 🐳 Docker Compose Services

### Backend Service
```yaml
Container: ffsd-backend
Port: 5000
Environment: MongoDB, Redis, JWT, Razorpay, Cloudinary
Health Check: Every 30s
```

**Key features:**
- Multi-stage build (optimized ~200MB)
- Node Alpine 18 (lightweight)
- Automatic database migrations
- Health checks enabled
- Volume mounts for uploads & logs

### Frontend Service
```yaml
Container: ffsd-frontend
Port: 80
Reverse Proxy: Nginx to Backend (/api)
```

**Key features:**
- Multi-stage build (optimized ~50MB)
- Nginx Alpine (lightweight)
- SPA routing support
- Gzip compression enabled
- Cache control headers
- API proxying configured

### MongoDB Service
```yaml
Container: ffsd-mongodb
Port: 27017
Auth: admin/admin123
Database: rentease
```

**Persistence:**
- Volume: `mongodb_data` (database)
- Volume: `mongodb_config` (configuration)

### Redis Service
```yaml
Container: ffsd-redis
Port: 6379
Password: redis123
```

**Persistence:**
- Volume: `redis_data` (RDB snapshots)
- AOF logging enabled

---

## 📊 Common Commands

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Executing Commands
```bash
# Run tests in backend
docker-compose exec backend npm test

# Access backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Redis CLI
docker-compose exec redis redis-cli -a redis123
```

### Database Operations
```bash
# View collections
db.getCollectionNames()

# Count documents
db.properties.countDocuments()

# Drop database
db.dropDatabase()
```

### Rebuilding Images
```bash
# Rebuild all images
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend

# Rebuild and restart
docker-compose up -d --build
```

---

## 🔧 Configuration Details

### Backend Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | production | ✓ | Environment mode |
| `PORT` | 5000 | ✓ | Backend port |
| `JWT_SECRET` | - | ✓ | JWT signing secret (64+ chars) |
| `MONGODB_URI` | - | ✓ | MongoDB connection string |
| `REDIS_URL` | - | ✓ | Redis connection URL |
| `CLIENT_URL` | http://localhost | ✓ | Frontend URL for CORS |
| `RAZORPAY_KEY_ID` | - | ✓ | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | - | ✓ | Razorpay secret key |
| `CLOUDINARY_CLOUD_NAME` | - | ✓ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | - | ✓ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | - | ✓ | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | - | ✓ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | ✓ | Google OAuth secret |

### Frontend Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `VITE_API_URL` | http://backend:5000 | - | Backend API URL |
| `VITE_GOOGLE_MAPS_API_KEY` | - | - | Google Maps API key |

### Health Checks

All services include health checks:

```bash
# View health status
docker-compose ps

# Check specific service
docker inspect ffsd-backend --format='{{json .State.Health}}'
```

---

## 🚢 Production Deployment

### Pre-deployment Checklist

```bash
# 1. Verify all tests pass
docker-compose exec backend npm test

# 2. Check logs for errors
docker-compose logs --tail=100

# 3. Verify connectivity
docker-compose exec backend wget http://frontend -O /dev/null
docker-compose exec frontend wget http://backend:5000/api/health -O /dev/null

# 4. Create backup of volumes
docker run --rm -v ffsd-mongodb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data
```

### Environment for Production

```env
NODE_ENV=production
JWT_SECRET=<generate-strong-64-char-random-string>
CLIENT_URL=https://yourdomain.com
RAZORPAY_KEY_ID=<production-key>
RAZORPAY_KEY_SECRET=<production-secret>
CLOUDINARY_CLOUD_NAME=<your-name>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-secret>
```

### Production Deployment Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker-compose build --no-cache

# 3. Pull external images
docker-compose pull

# 4. Stop old containers
docker-compose down

# 5. Start with new images
docker-compose up -d

# 6. Verify health
docker-compose ps
docker-compose logs -f

# 7. Monitor for errors
docker-compose logs --follow backend
```

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check port conflicts
netstat -an | grep 5000
netstat -an | grep 27017
netstat -an | grep 6379

# View detailed logs
docker-compose logs backend

# Check Docker daemon
docker ps
```

### Backend can't connect to MongoDB
```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection from backend
docker-compose exec backend npm run test:db
```

### Frontend shows blank page
```bash
# Check build artifacts
docker-compose exec frontend ls -la /usr/share/nginx/html

# Check Nginx errors
docker-compose logs frontend

# Test API connectivity
docker-compose exec frontend wget -O - http://backend:5000/api/health
```

### High memory usage
```bash
# Check Docker stats
docker stats

# Remove unused containers/images
docker system prune -a

# Limit container memory in docker-compose.yml
# Add: deploy: resources: limits: memory: 512M
```

### Redis connection issues
```bash
# Check Redis is running
docker-compose exec redis redis-cli -a redis123 ping

# Clear Redis cache
docker-compose exec redis redis-cli -a redis123 FLUSHALL

# Check Redis logs
docker-compose logs redis
```

---

## 📈 Performance Optimization

### Enable BuildKit for faster builds
```bash
export DOCKER_BUILDKIT=1
docker-compose build --no-cache
```

### Resource Limits (Optional)
```yaml
# Add to service in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Network Optimization
```bash
# Use host network (Linux only, faster)
docker-compose up --compatibility
```

---

## 🔐 Security Best Practices

✅ **Implemented:**
- Non-root user in containers
- Health checks on all services
- Secrets via environment variables
- Network isolation with bridge network
- Read-only root filesystems (optional)
- Resource limits (optional)

✅ **Recommended for Production:**
- Use secrets manager (AWS Secrets, Vault)
- Enable HTTPS/TLS
- Use private container registry
- Regular security scans
- Network policies/firewall rules
- Backup strategy for volumes
- Monitoring and alerting

---

## 📝 Dockerfile Details

### Backend (Dockerfile.backend)
- **Base**: node:18-alpine (94MB)
- **Build Stage**: Installs dependencies
- **Runtime Stage**: Multi-stage optimization
- **Size**: ~200MB final image
- **Entry**: dumb-init for signal handling

### Frontend (Dockerfile.frontend)
- **Build Stage**: node:18-alpine builds React
- **Runtime Stage**: nginx:alpine serves static files
- **Size**: ~50MB final image
- **Features**: SPA routing, API proxying, compression

---

## 🆘 Getting Help

### View detailed diagnostics
```bash
# Full system info
docker-compose config

# Service connectivity test
docker-compose exec backend ping mongodb
docker-compose exec backend ping redis

# Network inspection
docker network inspect ffsd_ffsd-network
```

### Collect logs for debugging
```bash
# Save all logs to file
docker-compose logs > debug-logs.txt 2>&1

# Export compose configuration
docker-compose config > compose-config.yml
```

---

## ✨ Next Steps

1. **Run tests**: `docker-compose exec backend npm test`
2. **Check health**: `docker-compose ps`
3. **View API docs**: http://localhost/api-docs (if Swagger enabled)
4. **Monitor logs**: `docker-compose logs -f`
5. **Deploy to production**: Follow production deployment steps above

**Created**: April 17, 2026
**Version**: 1.0
**Compatibility**: Docker 20.10+, Docker Compose 2.10+
