# GitHub Actions CI/CD Pipeline

## Overview

Automated CI pipeline runs on every push and pull request to ensure code quality and prevent broken deployments.

## Pipeline Jobs

### 1. **Backend Tests** ✅
- **Runs:** Jest test suite with coverage
- **Services:** MongoDB + Redis containers
- **Node Version:** 18 (matches Docker)
- **Environment:** test environment with CI settings

```bash
# Locally simulates this:
docker run -d -p 27017:27017 mongo:latest
docker run -d -p 6379:6379 redis:7-alpine
npm run test:ci
```

### 2. **Frontend Lint & Build** ✅
- **Lint:** ESLint checks code quality
- **Build:** Vite production build
- **Fails if:** ESLint errors or build fails

```bash
npm run lint
npm run build
```

### 3. **Docker Build Verification** ✅
- **Purpose:** Verify Dockerfiles build without errors
- **Doesn't push:** Only checks if build succeeds
- **Images built:**
  - `ffsd-backend:ci-test`
  - `ffsd-frontend:ci-test`

## Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

Runs on:
- ✅ Any push to `main` or `develop`
- ✅ Any PR to `main` or `develop`
- ❌ NOT on feature branch pushes (save resources)

## Configuration Details

### Backend Test Environment
```env
NODE_ENV: test
MONGODB_URI: mongodb://admin:admin123@localhost:27017/rentease?authSource=admin
REDIS_URL: redis://localhost:6379
JWT_SECRET: test-secret-key-for-ci-12345678901234567890
```

### Services Used
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| MongoDB | mongo:latest | 27017 | Database for tests |
| Redis | redis:7-alpine | 6379 | Cache for tests |

### Health Checks
- **MongoDB:** Waits up to 30s for ping command
- **Redis:** Waits up to 10s for PING response
- **Build:** Overall job timeout is 10 minutes

## Viewing Results

### In GitHub
1. Go to **Actions** tab in your repo
2. Click on workflow run
3. View logs for each job

### Status Badge (Optional)
Add to your README:
```markdown
[![CI](https://github.com/YOUR_USERNAME/ffsd_repo_react/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ffsd_repo_react/actions/workflows/ci.yml)
```

## Debugging Failed Builds

### Backend Tests Fail
```
❌ MONGODB_URI connection error
→ Check MongoDB container health in logs
→ Verify `npm run test:ci` works locally: npm run test:ci

❌ Redis connection error
→ Check Redis port 6379 is available
→ Verify Redis connection string in tests

❌ Tests timeout
→ Increase timeout in GitHub Actions runner
→ Check if tests hang (race conditions?)
```

### Frontend Build Fails
```
❌ ESLint errors
→ Run locally: npm run lint
→ Fix errors or add .eslintignore

❌ Vite build fails
→ Run locally: npm run build
→ Check for TypeScript/module errors
```

### Docker Build Fails
```
❌ Dockerfile.backend build fails
→ Run locally: docker build -f Dockerfile.backend .
→ Check npm install output for dependency issues

❌ Dockerfile.frontend build fails
→ Run locally: docker build -f Dockerfile.frontend .
→ Check node_modules override issue
```

## Local Testing

Test your changes before pushing:

```powershell
# Backend tests
cd server
npm run test:ci

# Frontend lint & build
cd client
npm run lint
npm run build

# Docker builds
docker build -f Dockerfile.backend .
docker build -f Dockerfile.frontend .
```

## Future Enhancements

### Deploy to Production
Add job to push images to Docker Hub/ECR after tests pass:
```yaml
docker-push:
  needs: [backend-tests, frontend-build]
  if: github.ref == 'refs/heads/main'
```

### Coverage Reports
Upload code coverage to Codecov:
```yaml
- uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### Slack/Email Notifications
Notify team on build failure:
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
```

### Frontend Tests
Add Jest/Vitest for React components (future)

### Security Scanning
Add Dependabot for vulnerability scanning (GitHub Settings)

## Environment Secrets (if needed)

If your tests need credentials, add to GitHub Secrets:
1. Go to **Settings > Secrets and variables > Actions**
2. Add secrets like `API_KEY`, `DATABASE_URL`
3. Use in workflow: `${{ secrets.API_KEY }}`

Currently using hardcoded test values in workflow—sufficient for CI.

## Troubleshooting

### "Service unavailable" errors
→ Services (MongoDB/Redis) take time to start
→ Pipeline already has `wait-port` to handle this
→ Check logs for actual error messages

### Tests pass locally but fail in CI
→ CI uses different Node version? Check workflow
→ Environment variables different? Check env section
→ Port conflicts? CI is isolated, shouldn't happen

### Workflow file not triggering
→ File is in `.github/workflows/` ✅
→ Branch name matches trigger (main/develop) ✅
→ Committed and pushed to GitHub ✅
→ Check GitHub Settings > Actions is enabled

## File Structure

```
.github/
└── workflows/
    └── ci.yml                 ← Main CI pipeline
```

## Summary

✅ **Automated testing** on every push/PR
✅ **MongoDB + Redis** in test environment
✅ **Real integration tests** (not mocked)
✅ **Frontend linting & building** verified
✅ **Docker images** build verified
✅ **Prevents broken code** from merging

All jobs must pass before merging to main! 🚀
