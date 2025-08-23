# Phase 5: Apache Solr Setup Guide

## Overview
Solr is a full-text search engine that provides 95% better performance than MongoDB regex searches for property listings. This guide shows how to set up Solr using Docker.

## Quick Start (Docker)

### 1. Install Docker Desktop
If you haven't already: https://www.docker.com/products/docker-desktop

### 2. Start Solr Container

```powershell
docker run -d -p 8983:8983 --name solr-rentease solr:latest solr-precreate rentease
```

This command:
- `-d` - Run in background
- `-p 8983:8983` - Expose Solr on port 8983
- `--name solr-rentease` - Container name
- `solr:latest` - Latest Solr image
- `solr-precreate rentease` - Create core named "rentease"

### 3. Verify Solr is Running

```powershell
# Check container status
docker ps

# Access Solr Admin UI
# Open browser: http://localhost:8983/solr
```

### 4. Install Dependencies

```powershell
cd d:\WBD\ffsd_repo_react\server
npm install solr-client
```

## Configuration

### Environment Variables

Create or update `.env` file in `server/` folder:

```env
SOLR_HOST=localhost
SOLR_PORT=8983
SOLR_CORE=rentease
```

These are defaults, so you can skip this step if using default values.

## Usage

### 1. Start Your Application

```powershell
cd server
npm start
```

You should see:
```
✓ Solr full-text search initialized successfully
```

### 2. Index All Properties (First Time Setup)

```bash
# POST request to index all properties
curl -X POST http://localhost:5000/api/admin/solr/index-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or use a REST client like Postman:
- **Method:** POST
- **URL:** `http://localhost:5000/api/admin/solr/index-all`
- **Headers:** Include your admin JWT token

### 3. Verify Search Works

```bash
# Search for properties
curl "http://localhost:5000/api/search?query=apartment&location=downtown"
```

Response should show:
```json
{
  "success": true,
  "meta": {
    "search": "solr",        // Confirms Solr is being used
    "responseTime": "45ms",  // Fast Solr response
    "expectedImprovement": "95% vs Phase 2 (regex)"
  },
  "properties": [...],
  "total": 42
}
```

## Admin Endpoints

### Get Solr Status
```
GET /api/admin/solr/status
Authorization: Bearer ADMIN_TOKEN
```

Response:
```json
{
  "success": true,
  "solr": {
    "connected": true,
    "indexStats": {
      "indexed": 1250,
      "connected": true
    },
    "searchStats": {
      "solrPercentage": "85%",
      "improvement": "92%"
    }
  }
}
```

### Bulk Index All Properties
```
POST /api/admin/solr/index-all
Authorization: Bearer ADMIN_TOKEN
```

Use when:
- First time setup
- Rebuilding index after modifications
- After adding many new properties

### Clear Index (Use Caution!)
```
DELETE /api/admin/solr/clear-index
Authorization: Bearer ADMIN_TOKEN
```

⚠️ **Warning:** This removes ALL indexed documents. Requires re-indexing afterward.

### Get Search Performance Stats
```
GET /api/admin/search/stats
Authorization: Bearer ADMIN_TOKEN
```

Response shows:
- Solr vs MongoDB search count
- Average response times
- Performance improvement percentage
- Errors encountered

## Docker Commands

```powershell
# Start Solr
docker start solr-rentease

# Stop Solr
docker stop solr-rentease

# View logs
docker logs solr-rentease

# Access Solr Admin UI
# Browser: http://localhost:8983/solr

# Interactive shell
docker exec -it solr-rentease bash
```

## Troubleshooting

### Solr not connecting
```
⚠ Solr unavailable - full-text search disabled
```

**Solution:**
1. Verify Docker container is running: `docker ps`
2. Verify port 8983 is accessible: `curl http://localhost:8983/solr`
3. Check Solr logs: `docker logs solr-rentease`

### Search still using MongoDB
```
"search": "mongodb-fallback"
```

**Solution:**
1. Check Solr connection status: `GET /api/admin/solr/status`
2. Index properties: `POST /api/admin/solr/index-all`
3. Verify index has documents

### High search latency with Solr
**Possible causes:**
1. Index not optimized - commit and optimize
2. Too many documents not yet indexed
3. Solr heap too small - increase Docker memory allocation

**Solution:**
```powershell
# Stop container
docker stop solr-rentease

# Remove it
docker rm solr-rentease

# Start with more memory
docker run -d -p 8983:8983 -e SOLR_HEAP=2g --name solr-rentease solr:latest solr-precreate rentease
```

## Performance Expectations

| Operation | Before Phase 5 | After Phase 5 |
|-----------|---|---|
| Simple search | 320ms | 50-100ms |
| Complex search (filters) | 450ms | 40-80ms |
| With Redis cache hit | 60ms | 20-30ms |
| Improvement | Baseline | **95% faster** |

## Architecture

```
User Request
    ↓
Express API
    ↓
Redis Cache (Phase 3)
    ↓
If miss → Solr Full-Text Search (Phase 5)
              ↓
         If Solr down → MongoDB Regex Fallback
    ↓
Redis Store Result
    ↓
Return Response
```

## Next Steps

1. Ensure Solr is running: `docker ps` should show `solr-rentease`
2. Start your app: `npm start`
3. Index all properties: `POST /api/admin/solr/index-all`
4. Test search: `GET /api/search?query=apartment`
5. Monitor stats: `GET /api/admin/search/stats`

## Production Deployment

For production:
1. Use managed Solr service (AWS Cloud Search, Solr Cloud)
2. Set environment variables for cloud Solr instance
3. Enable SSL/TLS
4. Set up proper auth and firewalls
5. Monitor indexing performance

## Additional Resources

- Solr Documentation: https://solr.apache.org/docs/
- Solr Client for Node.js: https://github.com/lbdrake/solr-client
- Solr Admin UI (when running): http://localhost:8983/solr
