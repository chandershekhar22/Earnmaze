# Updated Guest Session Flow

## Overview
When users enter their email on the earn-money page, they are:
1. **Registered** as a new user in the database (user + panelist tables)
2. **Given a guest session** for tracking
3. **Redirected to a survey** to complete immediately
4. **Returned to guest dashboard** after survey completion

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Earn-Money Landing Page                      │
│                    /earn-money                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ User enters email
                         │ Completes Turnstile
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POST /api/save-email                            │
│                                                                  │
│  1. Validate email & Turnstile                                  │
│  2. Track email conversion (analytics)                          │
│  3. Check if user exists                                        │
│     ├─ If EXISTS: Use existing userId                           │
│     └─ If NEW:                                                  │
│         ├─ Create user record (temp password)                   │
│         ├─ Create panelist profile                              │
│         └─ Initialize points (0 points)                         │
│  4. Create/reuse guest session                                  │
│  5. Link guest session to userId                                │
│  6. Set httpOnly cookie                                         │
│  7. Find first available survey                                 │
│  8. Return redirect to survey                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Redirect
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Survey Page                                    │
│                   /surveys/[id]                                  │
│                                                                  │
│  - Show loading state                                           │
│  - [Future] Load survey from external link                      │
│  - [Future] Track survey view                                   │
│  - Simulate completion (demo)                                   │
│  - Show success message                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ After survey (2 seconds demo)
                         │ Redirect with params:
                         │ ?from=survey&completed=true&new=true
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Guest Dashboard                               │
│                    /guest/dashboard                              │
│                                                                  │
│  First Visit:                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🎉 Welcome to EarnMaze!                                  │  │
│  │ Your account has been created!                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Returning from Survey:                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Welcome back! Great job completing the survey!         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Dashboard Content:                                             │
│  - Session stats (points, surveys viewed/completed)             │
│  - Time remaining (24h countdown)                               │
│  - Available surveys list                                       │
│  - Upgrade to full account button                               │
│  - Logout option                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Database Changes on Email Submit

### New User Registration

**users table:**
```sql
INSERT INTO users (
  email,
  name,              -- email prefix
  password,          -- temporary random password
  user_type,         -- 'panelist'
  email_verified,    -- false
  registration_source, -- 'earn-money-page'
  utm_source,
  utm_medium,
  utm_campaign,
  is_active          -- true
)
```

**panelists table:**
```sql
INSERT INTO panelists (
  user_id,           -- link to user
  status,            -- 'active'
  tier,              -- 'bronze'
  referral_code      -- random unique code
)
```

**panelist_points table:**
```sql
INSERT INTO panelist_points (
  panelist_id,
  current_points,    -- 0
  lifetime_points,   -- 0
  pending_points,    -- 0
  redeemed_points    -- 0
)
```

### Guest Session

**guest_sessions table:**
```sql
INSERT INTO guest_sessions (
  email,
  token,                  -- secure random token
  status,                 -- 'active'
  expires_at,             -- NOW() + 24 hours
  upgraded_to_user_id,    -- link to user.id
  ip_address,
  user_agent,
  surveys_viewed,         -- 0
  surveys_completed,      -- 0
  session_points          -- 0
)
```

## API Response

**POST /api/save-email** response:
```json
{
  "success": true,
  "userId": "uuid-of-user",
  "sessionId": "uuid-of-guest-session",
  "isNewUser": true,
  "redirectUrl": "/surveys/[survey-id]"
}
```

## Key Features

### ✅ Instant Account Creation
- User account created without password setup
- Panelist profile initialized automatically
- Points system ready to track earnings
- Guest session links to permanent user account

### ✅ Survey-First Experience
- User immediately sent to take a survey
- Engaging experience right from the start
- Dashboard shown after survey completion

### ✅ Welcome Messages
- **First visit**: "Welcome to EarnMaze! Your account has been created"
- **After survey**: "Welcome back! Great job completing the survey"
- Auto-dismiss after 5-8 seconds

### ✅ Session Continuity
- Guest session cookie tracks user
- User data persists in database
- Points can be accumulated over time
- User can upgrade to full account later

## User States

### New User
1. Email submitted → User created → Survey shown
2. Survey completed → Dashboard with "Welcome" banner
3. Can browse surveys, earn points
4. Prompted to set password and fully activate account

### Returning User
1. Email submitted → Existing user found → Survey shown
2. Survey completed → Dashboard with "Welcome back" banner
3. Session reused if still active
4. All previous data available

### Upgrade Path
From guest dashboard, user can:
- Click "Set Password" or "Complete Registration"
- Create proper password
- Verify email
- Full account activated
- Access to rewards redemption

## Implementation Files

### Modified
- `src/routes/api/save-email/+server.ts` - Creates user, panelist, and session
- `src/routes/(public)/earn-money/+page.svelte` - Handles new user redirect
- `src/routes/guest/dashboard/+page.svelte` - Shows welcome banners

### Created
- `src/routes/surveys/[id]/+page.svelte` - Survey loading/completion page
- `src/routes/surveys/[id]/+page.ts` - Survey page loader

## Testing the Flow

### Manual Test
1. Visit `http://localhost:5173/earn-money`
2. Enter email: `newuser@test.com`
3. Complete Turnstile
4. Click "Get Started"
5. ✅ Should redirect to `/surveys/[id]`
6. Wait 2 seconds (simulated survey)
7. ✅ Should redirect to `/guest/dashboard?from=survey&completed=true&new=true`
8. ✅ Should see "Welcome to EarnMaze!" banner
9. ✅ Should see "Welcome back!" banner
10. Both banners auto-dismiss

### Database Verification
```sql
-- Check user was created
SELECT id, email, name, user_type, registration_source 
FROM users 
WHERE email = 'newuser@test.com';

-- Check panelist was created
SELECT p.id, p.user_id, p.status, p.tier, p.referral_code
FROM panelists p
JOIN users u ON p.user_id = u.id
WHERE u.email = 'newuser@test.com';

-- Check points initialized
SELECT pp.* 
FROM panelist_points pp
JOIN panelists p ON pp.panelist_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = 'newuser@test.com';

-- Check guest session linked
SELECT gs.*, u.email
FROM guest_sessions gs
LEFT JOIN users u ON gs.upgraded_to_user_id = u.id
WHERE gs.email = 'newuser@test.com';
```

## Future Enhancements

### Phase 2
- [ ] Real survey integration (external links)
- [ ] Points awarding on survey completion
- [ ] Track survey progress (started/completed)
- [ ] Multiple survey completion tracking
- [ ] Email verification flow

### Phase 3
- [ ] Password setup prompt
- [ ] Profile completion incentives
- [ ] Referral code sharing
- [ ] Points redemption for verified users
- [ ] Tier advancement based on activity

## Key Benefits

1. **Frictionless Onboarding**: User is in the system immediately
2. **Immediate Engagement**: Survey shown right away
3. **Data Persistence**: All activity tracked in permanent tables
4. **Easy Upgrade**: User can fully activate account anytime
5. **Flexible Flow**: Works for both new and returning users

---

**Status**: ✅ Implemented and ready for testing
**Date**: December 4, 2025
