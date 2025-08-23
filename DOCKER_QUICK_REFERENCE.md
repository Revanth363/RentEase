# Docker Quick Reference

## Start/Stop

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart backend
```

## Logs & Monitoring

```bash
# View all logs
docker-compose logs -f

# Specific service (last 50 lines)
docker-compose logs --tail=50 -f backend

# Service status
docker-compose ps
```

## Build & Deploy

```bash
# Build images
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Start with rebuild
docker-compose up -d --build
```

## Database Operations

```bash
# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Redis CLI
docker-compose exec redis redis-cli -a redis123

# Clear Redis cache
docker-compose exec redis redis-cli -a redis123 FLUSHALL
```

## Backend Commands

```bash
# Tests
docker-compose exec backend npm test

# Install dependencies
docker-compose exec backend npm install

# Shell access
docker-compose exec backend sh
```

## Network & Connectivity

```bash
# Test backend from frontend
docker-compose exec frontend wget http://backend:5000/api/health

# Test frontend from backend
docker-compose exec backend wget http://frontend

# View network info
docker network inspect ffsd_ffsd-network
```

## Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove dangling images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (CAREFUL!)
docker system prune -a --volumes
```

## Useful Aliases

```bash
# Add to .bashrc or .zshrc
alias dc='docker-compose'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dcrestart='docker-compose restart'
```

## Environment Setup

```bash
# Copy template
cp .env.docker .env

# Edit configuration
nano .env

# Validate
grep -E '^[A-Z_]+=' .env | wc -l
```

## Health Check

```bash
# Verify all services healthy
docker-compose ps

# Check specific service
docker inspect ffsd-backend --format='{{json .State.Health}}'

# Service logs
docker-compose logs backend | grep -i error
```

## Performance

```bash
# View resource usage
docker stats

# Limit resources
# Edit docker-compose.yml and add:
#   deploy:
#     resources:
#       limits:
#         memory: 512M
```

## Backup & Restore

```bash
# Backup MongoDB
docker-compose exec -T mongodb mongodump --uri="mongodb://admin:admin123@localhost:27017/rentease" --out /tmp/backup

# Backup Redis
docker-compose exec redis redis-cli -a redis123 BGSAVE

# Backup volumes
docker run --rm -v ffsd-mongodb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## Debugging

```bash
# View detailed config
docker-compose config

# Check network connectivity
docker-compose exec backend ping mongodb
docker-compose exec backend ping redis

# View system info
docker system df

# Inspect container
docker inspect ffsd-backend
```
