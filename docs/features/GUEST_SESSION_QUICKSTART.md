# Guest Session System - Quick Start Guide

## Overview

The Guest Session system allows users to access EarnMaze Panel with just their email - no password or verification required. Users get instant access to view available surveys and earn session points.

## Key Features

### Instant Access
- **No verification**: Just enter email and click "Get Started"
- **No Turnstile**: Simplified login flow without CAPTCHA
- **Automatic login**: Session created immediately upon email submission

### Session Limitations
- **24-hour expiry**: Sessions automatically expire after 24 hours
- **Session-only points**: Points reset when session expires
- **No rewards redemption**: Must upgrade to full account to redeem
- **Limited history**: Only current session data visible

### Upgrade Path
- Clear prompts to encourage full registration
- Pre-filled email when upgrading
- Points can be transferred upon upgrade (future feature)

## Architecture

### Database Schema

**Table:** `guest_sessions`

Key fields:
- `email`: User's email address
- `token`: Unique session token (stored in cookie)
- `status`: active | expired | upgraded
- `expiresAt`: Session expiration timestamp
- `sessionPoints`: Points earned in this session only
- `surveysViewed`: Surveys viewed counter
- `surveysCompleted`: Surveys completed counter
- `upgradedToUserId`: Reference when user upgrades to full account

### API Endpoints

#### POST `/api/guest/login`
Creates or reuses guest session with email only.

**Request:**
```json
{
  "email": "user@example.com",
  "fingerprint": "optional-browser-fingerprint"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "email": "user@example.com",
  "expiresAt": "2025-12-05T12:00:00Z",
  "message": "Welcome! You can now view surveys and start earning points."
}
```

**Sets cookie:** `guest_session` (24-hour expiry)

#### GET `/api/guest/dashboard`
Fetches guest session data and available surveys.

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "sessionPoints": 150,
    "surveysViewed": 5,
    "surveysCompleted": 2,
    "expiresAt": "2025-12-05T12:00:00Z",
    "availableSurveys": [
      {
        "id": "uuid",
        "title": "Consumer Preferences Survey",
        "description": "Share your shopping habits",
        "category": "Shopping",
        "points": 50,
        "estimatedMinutes": 10
      }
    ]
  }
}
```

#### POST/GET `/api/guest/logout`
Clears guest session cookie and logs user out.

### Routes

- **`/guest/login`**: Simple email input form
- **`/guest/dashboard`**: Session dashboard with stats and surveys
- **`/register?email=X`**: Upgrade to full account (pre-filled)

## User Flow

1. **Landing**: User visits `/guest/login`
2. **Email Entry**: User enters email, clicks "Get Started Now"
3. **Instant Login**: API creates session, sets cookie, redirects to dashboard
4. **Dashboard**: User sees:
   - Session points counter
   - Surveys viewed/completed
   - Time remaining in session
   - Available surveys list
   - Upgrade prompts
5. **Upgrade Option**: User clicks "Create Full Account"
   - Redirected to `/register` with email pre-filled
   - Can create password and save progress

## Implementation

### Guest Login Page

```svelte
<script lang="ts">
  let email = $state('');
  let isLoading = $state(false);
  
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    
    const response = await fetch('/api/guest/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    if (result.success) {
      goto('/guest/dashboard');
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <input bind:value={email} type="email" required />
  <button type="submit" disabled={isLoading}>
    Get Started Now
  </button>
</form>
```

### Guest Store

Located at: `src/lib/stores/guest.svelte.ts`

```typescript
class GuestStore {
  data = $state<GuestDashboardData | null>(null);
  isLoading = $state(false);
  isAuthenticated = $state(false);
  
  async fetchDashboard() { /* ... */ }
  async logout() { /* ... */ }
}

export const guestStore = new GuestStore();
```

### Session Validation

```typescript
// In API routes
const token = cookies.get('guest_session');
const session = await db.query.guestSession.findFirst({
  where: and(
    eq(guestSession.token, token),
    eq(guestSession.status, 'active'),
    gt(guestSession.expiresAt, new Date())
  )
});

if (!session) {
  return json({ success: false, error: 'SESSION_EXPIRED' }, { status: 401 });
}
```

## Database Migration

Run migration to create guest session tables:

```bash
npm run db:migrate
```

This applies migration: `0003_overjoyed_captain_stacy.sql`

## Security Considerations

### Current Implementation
- ✅ Session tokens are cryptographically secure (32 random bytes)
- ✅ HttpOnly cookies prevent XSS attacks
- ✅ Sessions expire automatically after 24 hours
- ✅ Invalid sessions are cleared immediately

### Future Enhancements
- Rate limiting by IP address
- Browser fingerprinting for abuse prevention
- Email verification for reward redemption
- Geo-restriction integration
- VPN/TOR detection

## Testing

### Manual Testing Flow

1. Navigate to `/guest/login`
2. Enter email: `test@example.com`
3. Verify immediate redirect to `/guest/dashboard`
4. Check dashboard shows:
   - Email address
   - 0 session points
   - 0 surveys viewed/completed
   - ~24h remaining
   - List of available surveys
5. Click "Logout" → redirects to `/guest/login`
6. Re-login with same email → reuses existing session

### Edge Cases

- **Expired session**: Should clear cookie and redirect to login
- **Invalid token**: Should clear cookie and redirect to login
- **No surveys**: Dashboard shows empty state
- **Email reuse**: Multiple logins with same email reuse active session

## Future Enhancements

### Phase 2
- [ ] Survey participation tracking
- [ ] Points earning mechanism
- [ ] Session history (last 3 sessions)
- [ ] Email notification option

### Phase 3
- [ ] Points transfer on upgrade
- [ ] Session resume from email link
- [ ] Progressive profiling prompts
- [ ] Social sharing incentives

## Configuration

No environment variables required - works out of the box.

Optional:
```bash
# In .env (if adding rate limiting)
GUEST_SESSION_DURATION=86400  # 24 hours in seconds
GUEST_RATE_LIMIT_WINDOW=3600  # 1 hour
```

## Monitoring

Key metrics to track:
- Guest session creation rate
- Session → Full account conversion rate
- Average session duration
- Surveys viewed per session
- Points earned per session

Add to logging:
```typescript
Logger.auth.info('Guest session metrics', {
  sessionId,
  duration: sessionDurationMinutes,
  surveysViewed,
  surveysCompleted,
  pointsEarned,
  upgraded: false
});
```

## Troubleshooting

### "No guest session found" error
- Check if cookie is being set: Dev Tools → Application → Cookies
- Verify cookie domain matches current domain
- Ensure `httpOnly` flag is set correctly

### Session expires immediately
- Check server time vs database time
- Verify `expiresAt` calculation in API
- Check for timezone issues

### Dashboard not loading
- Check API response in Network tab
- Verify guest session token is valid
- Check database for active session

## Related Files

- Schema: `src/lib/db/schema/guest-sessions.ts`
- Login API: `src/routes/api/guest/login/+server.ts`
- Dashboard API: `src/routes/api/guest/dashboard/+server.ts`
- Login Page: `src/routes/guest/login/+page.svelte`
- Dashboard Page: `src/routes/guest/dashboard/+page.svelte`
- Guest Store: `src/lib/stores/guest.svelte.ts`

---

**Status**: ✅ Implemented and ready for testing
**Migration**: `drizzle/0003_overjoyed_captain_stacy.sql`
**Last Updated**: December 4, 2025
