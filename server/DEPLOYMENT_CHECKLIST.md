# JWT Migration Deployment Checklist

## Pre-Deployment ✅

### 1. Environment Setup
- [ ] Generate a strong `JWT_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Add `JWT_SECRET=<value>` to `.env` in `server/`
- [ ] Verify MongoDB connection string in `.env`
- [ ] Ensure `NODE_ENV=production` for production builds (secure cookies)

### 2. Dependencies
- [ ] Run `npm install` in `server/` directory
- [ ] Verify `jsonwebtoken` is installed: `npm list jsonwebtoken`
- [ ] Verify `express-session` is **NOT** in `package.json`
- [ ] Run `npm audit` to check for vulnerabilities
- [ ] Run `npm audit fix` if needed

### 3. Build & Compile
- [ ] Run `npm start` (or `npm run dev`) in `server/`
- [ ] Verify no build errors in console
- [ ] Ensure port 5000 is accessible

### 4. Migration Validation
- [ ] Search codebase for `express-session` imports → should be 0 matches
- [ ] Check `req.session.user` usage → should only be in comments or logs
- [ ] Verify `server/utils/jwt.js` exists
- [ ] Verify `server/middleware/auth.js` has `protect` & `adminProtect` exports

---

## Frontend Integration ✅

### 1. CORS Configuration
- [ ] React frontend runs on allowed origin (localhost:5173 or configured URL)
- [ ] API requests include `credentials: 'include'` for cookie handling
- [ ] CORS headers in server allow `credentials`

### 2. Auth Flow Testing
```javascript
// Test login
const res = await fetch('http://localhost:5000/api/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
});

// Verify cookie was set (DevTools → Application → Cookies)
// Should see "accessToken" with httpOnly flag
```

### 3. Protected Endpoints
- [ ] Test `/api/me` after login → returns current user
- [ ] Test protected route (e.g., `/api/tenant/dashboard`) → works after login
- [ ] Test protected route without login → returns 401
- [ ] Test admin route without admin role → returns 403

### 4. Logout
- [ ] Test `/api/logout` → clears `accessToken` cookie
- [ ] Verify subsequent `/api/me` returns `{ user: null, admin: false }`

---

## Security Verification ✅

### 1. Cookie Security
- [ ] Open DevTools → Application → Cookies
- [ ] Find `accessToken` cookie
- [ ] Verify `HttpOnly` flag is set ✓
- [ ] Verify `Secure` flag is set (production only)
- [ ] Verify `SameSite=Strict` is set

### 2. JWT Validation
- [ ] Extract JWT from cookie and validate at [jwt.io](https://jwt.io)
- [ ] Verify payload contains: `id`, `email`, `userType`, `iat`, `exp`
- [ ] Verify `exp` is 1 hour from `iat` (3600 seconds)

### 3. Secret Management
- [ ] `JWT_SECRET` is **NOT** committed to git
- [ ] `.env` is in `.gitignore`
- [ ] Use 64+ character secret in production
- [ ] Rotate secret annually

### 4. API Security
- [ ] Run `npm audit` and fix high/critical vulnerabilities
- [ ] Verify HTTPS is enforced in production (secure cookie)
- [ ] Verify rate limiting is active on auth endpoints
- [ ] Check CORS whitelist is not overly permissive

---

## Testing Scenarios ✅

### 1. Email/Password Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password"}' \
  -i  # Show headers to verify Set-Cookie
```
Expected: 200, `Set-Cookie: accessToken=...` in response

### 2. Google OAuth
- [ ] Redirect to `/auth/google`
- [ ] Complete Google login flow
- [ ] Verify callback sets JWT cookie
- [ ] Verify `/api/me` returns Google user data

### 3. Admin Detection
```bash
curl -X GET http://localhost:5000/api/me \
  -H "Cookie: accessToken=<token>" \
  -s | jq '.admin'
```
Expected: `true` for admin users, `false` for others

### 4. Expired Token
- [ ] Wait >1 hour (or manually edit cookie expiry)
- [ ] Try to access protected route
- [ ] Expected: 401 Unauthorized

### 5. Logout
```bash
curl -X GET http://localhost:5000/api/logout \
  -H "Cookie: accessToken=<token>" \
  -i  # Show headers to verify Set-Cookie: accessToken=; Max-Age=0;
```
Expected: Cookie cleared, subsequent requests fail with 401

---

## Post-Deployment ✅

### 1. Monitor Logs
- [ ] Check `server/logs/` for auth errors
- [ ] Monitor failed login attempts
- [ ] Alert on expired token errors (expected, low priority)

### 2. User Feedback
- [ ] Verify login/logout works as expected
- [ ] Verify dashboard loads after login
- [ ] Verify role-based access (tenant, owner, worker, admin)
- [ ] Verify Google OAuth login

### 3. Performance
- [ ] Monitor response times (JWT decode adds ~1-2ms)
- [ ] Check database query counts (user doc loading per request)
- [ ] Verify no memory leaks with tool (e.g., clinic.js)

### 4. Cleanup
- [ ] Remove old session data from database (if applicable)
- [ ] Archive old `req.session.user` logs
- [ ] Update documentation/wiki for new auth flow

---

## Troubleshooting

### Issue: "Cookie not being set"
**Solution:**
- Verify frontend sends `credentials: 'include'`
- Check CORS `Access-Control-Allow-Credentials: true` in response headers
- Verify `NODE_ENV` is set correctly
- Check `JWT_SECRET` is in `.env`

### Issue: "401 on protected routes after login"
**Solution:**
- Verify JWT cookie is present: `document.cookie` in console
- Verify cookie name is exactly `accessToken`
- Check JWT expiry time: `jwt_payload.exp * 1000 > Date.now()`
- Verify server logs for token validation errors

### Issue: "Google OAuth fails"
**Solution:**
- Verify Google Client ID/Secret in `.env`
- Verify redirect URI registered in Google Console matches callback
- Check passport.js configuration
- Ensure `/auth/google/callback` is reachable

### Issue: "Admin routes return 403"
**Solution:**
- Verify user `userType` is `'admin'` in database
- Regenerate JWT after setting admin role (logout/login)
- Check `adminProtect` middleware is applied to route

---

## Rollback Plan

If critical issues arise:

1. **Immediate (within minutes):**
   - Downtime: Restore previous server backup with express-session
   - Notify users of auth maintenance

2. **Short-term (if reverting):**
   - Revert to git commit before migration
   - Restore `node_modules/` or run `npm install` with old `package.json`
   - Clear all JWT cookies in browser (`document.cookie = 'accessToken=;'`)

3. **Long-term (post-fix):**
   - Debug migration issues
   - Retest locally before re-deployment

---

## Success Criteria ✅

Migration is **successful** when:
1. ✅ All tests pass (login, logout, protected routes, admin access)
2. ✅ Zero `401/403` errors from valid users
3. ✅ JWT cookies are `HttpOnly`, `Secure`, `SameSite=Strict`
4. ✅ Frontend receives `credentials: 'include'` and works seamlessly
5. ✅ Google OAuth works end-to-end
6. ✅ Logs show normal auth flow (no token validation errors)
7. ✅ Performance is not degraded

---

## Next Steps (Future)

- [ ] Implement token revocation (blacklist) for enhanced security
- [ ] Add refresh token rotation for longer sessions
- [ ] Set up rate limiting on auth endpoints
- [ ] Implement 2FA (two-factor authentication)
- [ ] Add device/session management UI

---

**Ready to deploy!** 🚀
