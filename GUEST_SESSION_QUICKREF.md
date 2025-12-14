# 🎯 Guest Session - Quick Reference

## What Is It?
**Instant access dashboard** - users enter email and immediately get logged in. No password, no verification, no waiting.

## User Experience

```
Earn-Money Page → Enter Email → Instant Login → Guest Dashboard
     ↓                ↓              ↓               ↓
  /earn-money    user@ex.com   auto-session    surveys & points
```

## Key Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/save-email` | POST | Create guest session from earn-money | Turnstile |
| `/api/guest/login` | POST | Direct guest login | None |
| `/api/guest/dashboard` | GET | Get session data & surveys | Cookie |
| `/api/guest/logout` | POST/GET | Clear session | Cookie |

## Quick Commands

```bash
# Generate migration (already done)
npm run db:generate

# Run migration (REQUIRED before use)
npm run db:migrate

# Start dev server
npm run dev

# Check database
docker exec -it earnmaze-db psql -U postgres -d earnmaze -c "SELECT email, status, expires_at FROM guest_sessions;"
```

## Test Flow

1. Visit: `http://localhost:5173/earn-money`
2. Enter: `test@example.com`
3. Complete Turnstile
4. Click "Get Started"
5. Verify redirect to `/guest/dashboard`
6. Check cookie: DevTools → Application → Cookies → `guest_session`
7. Verify httpOnly flag is ✅
8. Check dashboard shows: 0 points, 0 surveys, ~24h remaining

## Session Lifecycle

```
Create → Active (24h) → Expired → Cleanup
   ↓         ↓             ↓          ↓
 Login   Use dashboard  Auto-logout  DB purge
```

## Key Features

✅ Email-only login (no password)
✅ Instant access (no verification)  
✅ 24-hour sessions
✅ Session reuse (same email = same session)
✅ HttpOnly secure cookies
✅ Upgrade to full account
✅ Points tracking (session-scoped)

## Important Files

```
src/lib/db/schema/guest-sessions.ts          # Schema
src/routes/api/save-email/+server.ts         # Modified for guest session
src/routes/api/guest/login/+server.ts        # Guest login API
src/routes/api/guest/dashboard/+server.ts    # Dashboard API
src/routes/guest/login/+page.svelte          # Login page
src/routes/guest/dashboard/+page.svelte      # Dashboard page
src/lib/stores/guest.svelte.ts               # Guest store (Svelte 5)
```

## Session Data Structure

```typescript
{
  email: "user@example.com",
  sessionPoints: 0,           // Points in THIS session only
  surveysViewed: 0,           // Count this session
  surveysCompleted: 0,        // Count this session
  expiresAt: "2025-12-05...", // 24h from creation
  availableSurveys: [...]     // List of surveys
}
```

## Limitations (By Design)

❌ No permanent data storage
❌ No rewards redemption
❌ No complete history
❌ Session expires after 24h
❌ Points reset on new session

## Upgrade Path

Guest users can click "Create Full Account" to:
- Create password
- Save points permanently
- Access complete history
- Redeem rewards
- Get lifetime access

## Cookie Details

```
Name: guest_session
Value: 64-char hex token
Path: /
HttpOnly: true ✅
Secure: true (production) ✅
SameSite: Lax ✅
Max-Age: 86400 (24 hours)
```

## Logging

Check logs for:
```
Logger.auth.info('Creating guest session from earn-money')
Logger.auth.info('Reusing existing guest session')
Logger.auth.info('Guest session created, redirecting to dashboard')
Logger.api.info('Guest dashboard accessed')
```

## Troubleshooting

**Session not created?**
- Check API response in Network tab
- Verify Turnstile token (earn-money flow)
- Check database connection

**Dashboard not loading?**
- Check cookie is set: DevTools → Application → Cookies
- Verify token matches database: `SELECT token FROM guest_sessions WHERE email='...'`
- Check session not expired: `expires_at > NOW()`

**Cookie not persisting?**
- Check domain matches (localhost vs 127.0.0.1)
- Verify secure flag (false for localhost)
- Check browser privacy settings

## Migration Status

✅ **Generated**: `drizzle/0003_overjoyed_captain_stacy.sql`
⚠️ **Not Applied**: Run `npm run db:migrate` before testing

## Documentation

📖 **Full Guide**: `docs/features/GUEST_SESSION_QUICKSTART.md`
📋 **Implementation**: `docs/features/GUEST_SESSION_IMPLEMENTATION.md`

---

**Ready to Test**: After running migration ✅
**Status**: Feature Complete
**Date**: December 4, 2025
