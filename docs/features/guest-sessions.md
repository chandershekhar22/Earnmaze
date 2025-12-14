# Guest Session Feature

## Overview

The Guest Session feature allows users to access limited functionality by providing only their email address, without creating a full account. This "try before you buy" approach reduces friction for new users while providing a path to full registration.

## Features

### Guest Mode Capabilities
- **Email-only access** - No password required
- **View available surveys** - Browse all public surveys
- **Session-specific points tracking** - Track points earned in current session
- **24-hour sessions** - Automatically expire after 24 hours
- **Activity tracking** - View surveys viewed/started in current session
- **Turnstile protection** - CAPTCHA prevents abuse

### Limitations
- ❌ Cannot redeem rewards
- ❌ No access to lifetime points or history
- ❌ Session data not preserved after expiration
- ❌ Cannot complete profile or access tier benefits

### Upgrade Path
Users can upgrade to full accounts at any time:
- Prompted in dashboard with clear CTAs
- Simple registration form (name + password)
- Guest session data preserved during upgrade
- Seamless transition to full dashboard

## Architecture

### Database Schema

**`guest_sessions` table:**
- Stores temporary session information
- 24-hour expiration
- Tracks email, token, IP, user agent, fingerprint
- Session-specific metrics (surveys viewed/started, points)
- Upgrade tracking (references user ID after upgrade)

**`guest_survey_activity` table:**
- Per-session survey interaction tracking
- Prevents duplicate survey attempts
- Records view/start/completion times
- Session-specific points earned

### API Endpoints

#### `POST /api/guest/login`
Creates a new guest session with email validation and Turnstile CAPTCHA.

**Request:**
```json
{
  "email": "user@example.com",
  "turnstileToken": "token"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "email": "user@example.com",
  "expiresAt": "2025-12-05T12:00:00Z"
}
```

#### `GET /api/guest/dashboard`
Returns limited dashboard data for active guest session.

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "sessionPoints": 150,
    "surveysViewed": 5,
    "surveysStarted": 2,
    "expiresAt": "2025-12-05T12:00:00Z",
    "availableSurveys": [...],
    "recentActivity": [...]
  }
}
```

#### `POST /api/guest/logout`
Invalidates guest session and clears cookie.

#### `POST /api/guest/upgrade`
Upgrades guest session to full user account.

**Request:**
```json
{
  "name": "John Doe",
  "password": "securepass123",
  "turnstileToken": "token"
}
```

### Pages

- `/guest/login` - Guest session creation
- `/guest/dashboard` - Limited dashboard view
- `/guest/upgrade` - Account creation from guest session

### Store

`guestStore` (`$lib/stores/guest.svelte.ts`):
- Manages guest session state
- Fetches dashboard data
- Handles logout
- Svelte 5 runes-based reactivity

## Security Features

### Rate Limiting
- Prevents creating multiple guest sessions for same email within 1 hour
- Implemented in `hasRecentGuestSession()`

### CAPTCHA Protection
- Cloudflare Turnstile required for:
  - Guest session creation
  - Account upgrade

### Session Management
- HTTP-only cookies
- 24-hour expiration
- Secure flag in production
- SameSite=lax

### Abuse Prevention
- Browser fingerprinting (optional)
- IP tracking
- User agent logging
- Activity metrics monitoring

## Database Migration

To apply the guest session schema:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

## Usage Flow

### 1. Guest Login
```
User enters email → Turnstile verification → Guest session created → Redirect to dashboard
```

### 2. Guest Dashboard
```
View available surveys → Track session points → See activity → Prompted to upgrade
```

### 3. Account Upgrade
```
Click upgrade CTA → Fill name/password → Turnstile → Account created → Session upgraded
```

## Implementation Files

### Database
- `src/lib/db/schema/guest-sessions.ts` - Schema definitions
- `src/lib/db/repositories/guest-session.repository.server.ts` - Repository functions

### API Routes
- `src/routes/api/guest/login/+server.ts`
- `src/routes/api/guest/logout/+server.ts`
- `src/routes/api/guest/dashboard/+server.ts`
- `src/routes/api/guest/upgrade/+server.ts`

### Pages
- `src/routes/guest/login/+page.svelte`
- `src/routes/guest/dashboard/+page.svelte`
- `src/routes/guest/upgrade/+page.svelte`

### Store
- `src/lib/stores/guest.svelte.ts`

## Best Practices

### When to Use Guest Sessions
✅ First-time visitors wanting to explore
✅ Users unsure about committing to registration
✅ Quick access to view surveys
✅ Marketing campaigns with low-friction entry

### When to Require Full Registration
❌ Completing surveys
❌ Redeeming rewards
❌ Accessing payment information
❌ Profile completion
❌ Tier benefits

## Monitoring & Analytics

Track these metrics:
- Guest session creation rate
- Guest to registered conversion rate
- Average session duration
- Surveys viewed per guest session
- Upgrade funnel drop-off points

Use existing logging infrastructure:
```typescript
Logger.auth.info('Guest session created', { sessionId, email });
Features.trackUserAction('guest-upgrade-success', 'guest-upgrade');
Security.logSecurityEvent('guest-login-rate-limited', 'low');
```

## Future Enhancements

- [ ] Guest survey completion (with restrictions)
- [ ] Social proof (show other users' activity)
- [ ] Progressive disclosure of benefits
- [ ] Email reminders before session expiry
- [ ] Guest session analytics dashboard
- [ ] A/B testing different upgrade CTAs
- [ ] Session extension for active users

## Troubleshooting

### Guest session not found
- Check cookie `guest_session` is set
- Verify session hasn't expired (24 hours)
- Check session status is 'active' in database

### Can't create guest session
- Verify Turnstile is configured
- Check rate limiting (1 session per email per hour)
- Validate email format

### Upgrade fails
- Check if email already registered (show login instead)
- Verify guest session is still valid
- Check Turnstile validation

## Related Documentation

- [Authentication System](../features/authentication.md)
- [Turnstile CAPTCHA](../architecture/TURNSTILE_QUICKSTART.md)
- [Database Schema](../PROJECT_STRUCTURE.md)
- [API Response Types](../api/API_RESPONSE_TYPES.md)
