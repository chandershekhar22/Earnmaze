# EarnMaze Test Cases

## Auth

### POST /api/auth/register
- [ ] Registers user with valid email/password/name
- [ ] Rejects duplicate email (409)
- [ ] Rejects invalid email format
- [ ] Rejects weak password (missing uppercase/lowercase/number)
- [ ] Rejects password shorter than 8 chars
- [ ] Stores referralCode → creates referral record with status=pending
- [ ] Stores UTM params (utmSource, utmMedium, utmCampaign)
- [ ] Sets registrationSource from payload
- [ ] Blocks self-referral (same email as referrer → 400)
- [ ] Logs warning for invalid referral code but still registers
- [ ] Creates session cookie on success
- [ ] Returns user object without password hash

### POST /api/auth/login
- [ ] Logs in with valid credentials → returns session cookie
- [ ] Rejects invalid email (401)
- [ ] Rejects wrong password (401)
- [ ] Rejects inactive account (403)
- [ ] Rate limited: 5 attempts per 15 min

### POST /api/mobile/auth (JWT Login)
- [ ] Returns accessToken + refreshToken + user data
- [ ] Rejects invalid credentials (401)
- [ ] Rejects non-panelist users (403)
- [ ] Rejects inactive accounts (403)

### PATCH /api/mobile/auth (JWT Refresh)
- [ ] Returns new token pair with valid refresh token
- [ ] Rejects expired refresh token (401)
- [ ] Rejects access token used as refresh (401)
- [ ] Rejects tampered token (401)

### POST /api/auth/forgot-password
- [ ] Sends reset email for existing user
- [ ] Returns success even for non-existent email (no enumeration)
- [ ] Creates password reset token with 1hr expiry

### POST /api/auth/reset-password
- [ ] Resets password with valid token
- [ ] Invalidates all existing sessions
- [ ] Rejects expired token
- [ ] Rejects already-used token
- [ ] Rejects invalid token

---

## Surveys

### GET /api/surveys/available
- [ ] Returns active, non-deleted surveys
- [ ] Sorted by priority: high → medium → low
- [ ] Includes priority field in response
- [ ] Respects limit parameter

### Survey completion redirect (/redirect)
- [ ] Validates hash against rid+privateKey
- [ ] Redirects to /surveys on success (authenticated user)
- [ ] Redirects to /login on success (no session)
- [ ] Redirects to /guest/dashboard (guest session)
- [ ] Returns 403 for invalid hash
- [ ] Returns 400 for missing rid
- [ ] Handles all status codes: 1=completed, 2=terminated, 3=quota_full, 4=disqualified

### Survey completion processing
- [ ] Awards correct points based on status (completed=full, terminated=terminatedPoints, etc.)
- [ ] Creates points transaction record
- [ ] Triggers referral qualification on first completed survey
- [ ] Does NOT trigger referral on non-first completions
- [ ] Does NOT trigger referral on non-completed status (terminated, disqualified)

---

## Referrals

### Registration referral flow
- [ ] Valid referral code → referredBy stored on user record
- [ ] Valid referral code → referral record created (status=pending)
- [ ] Referral record has correct referrerBonus (50) and referredBonus (25)
- [ ] Invalid referral code → user still registers, no referral record
- [ ] Self-referral blocked (same email → 400)
- [ ] Duplicate referral prevented by unique constraint (referrerId + referredId)

### Referral qualification (on first survey completion)
- [ ] First completed survey → referral status changes to "paid"
- [ ] Referrer receives bonus points (50)
- [ ] Referred user receives bonus points (25)
- [ ] Second completed survey → no duplicate bonus
- [ ] Concurrent survey completions → only one bonus awarded (row lock)
- [ ] No referral record → qualification skipped silently
- [ ] Already-qualified referral → skipped

### Panelist referrals page
- [ ] Shows user's referral code
- [ ] Shows referral link with correct format (/register?ref=CODE)
- [ ] Shows list of referrals with correct status
- [ ] Shows stats: pending, qualified, paid counts
- [ ] Shows total earned from referrals

### Admin referrals page
- [ ] Shows all referrals with pagination
- [ ] Shows referrer and referred user names
- [ ] Shows bonus amounts and status
- [ ] Filters by status work correctly

---

## Rewards & Redemption

### GET /api/rewards
- [ ] Returns active, non-expired rewards
- [ ] Returns user's current points balance
- [ ] Returns user's redemption history

### POST /api/rewards/redeem (Request OTP)
- [ ] Validates reward exists and is active
- [ ] Checks user has sufficient points
- [ ] Checks stock availability
- [ ] Sends OTP to user's email via Celery task
- [ ] Returns reward details in response

### PATCH /api/rewards/redeem (Confirm OTP)
- [ ] Verifies OTP correctly → processes redemption atomically
- [ ] Creates redemption record with status=pending
- [ ] Deducts points from user's balance
- [ ] Logs points transaction (type=redeemed)
- [ ] Decrements reward stock
- [ ] Rejects invalid OTP (403)
- [ ] Rejects expired OTP (403)
- [ ] Rejects after 3 failed attempts
- [ ] OTP is single-use (can't reuse)
- [ ] New OTP request invalidates previous
- [ ] Checks per-user redemption limit (maxPerUser)
- [ ] Race condition: row lock prevents double-spend

### DELETE /api/rewards/redeem/[id] (Cancel)
- [ ] Cancels pending redemption
- [ ] Refunds points atomically
- [ ] Creates refund points transaction
- [ ] Rejects cancellation of non-pending redemptions (400)
- [ ] Rejects cancellation of other user's redemption (404)

---

## Support

### POST /api/panelist/support (Create ticket)
- [ ] Creates ticket with subject, message, priority
- [ ] Associates with authenticated panelist
- [ ] Returns ticket data

### PATCH /api/panelist/support (User reply)
- [ ] Adds reply as non-internal note
- [ ] Verifies ticket ownership
- [ ] Reopens resolved tickets on user reply
- [ ] Rejects replies on closed tickets (400)
- [ ] Rejects replies on other user's tickets (404)

### GET /api/panelist/support?ticketId=xxx (Get replies)
- [ ] Returns non-internal notes only
- [ ] Verifies ticket ownership
- [ ] Marks each reply with isAdmin flag

### PUT /api/admin/support/[id] (Admin reply)
- [ ] Adds admin reply text to ticket
- [ ] Also creates non-internal note for thread view
- [ ] Updates ticket status
- [ ] Records repliedBy and repliedAt

### PATCH /api/admin/support/[id] (Status/assign/note)
- [ ] Updates ticket status
- [ ] Assigns ticket to admin
- [ ] Adds internal note (not visible to panelist)

---

## Admin

### Survey management
- [ ] GET /api/admin/surveys — paginated with search/status/priority filters
- [ ] POST /api/admin/surveys — creates survey with priority field
- [ ] PATCH /api/admin/surveys/[id] — updates including priority
- [ ] DELETE /api/admin/surveys/[id] — soft deletes

### User management
- [ ] Search by email/name (text search)
- [ ] Search by UUID (exact match)
- [ ] Search by respondent ID (via survey_transactions lookup)
- [ ] Filter by user type
- [ ] Shows user ID (first 8 chars) in table

### Redemption management
- [ ] PATCH /api/admin/redemptions/[id] — updates status
- [ ] Supports all status transitions: pending→processing→completed/failed/cancelled
- [ ] Records approvedBy, processedBy, completedAt

---

## Security

### CSRF Protection
- [ ] CSRF cookie set on production requests
- [ ] Exempt endpoints: /api/logs, /api/analytics, /api/track-*
- [ ] Audit mode: logs violations but doesn't block (until migration complete)
- [ ] Disabled in development (NODE_ENV !== production)

### Password Reset
- [ ] Invalidates all sessions after reset
- [ ] Token expires after 1 hour
- [ ] Token single-use

### Session Management
- [ ] Session sliding window (renewed on activity)
- [ ] Expired sessions cleaned up hourly
- [ ] Invalid sessions deleted on access

### Rate Limiting
- [ ] Auth endpoints: 5 attempts per 15 min
- [ ] Nginx: /api/auth/* at 5r/m
- [ ] Nginx: /api/* at 30r/s
- [ ] Nginx: general at 10r/s

---

## Email (ZeptoMail via Celery)

### email.send.welcome
- [ ] Sends to correct email with userName placeholder
- [ ] Validates email format
- [ ] Retries on transient failure

### email.send.verify
- [ ] Sends OTP code with minutes placeholder
- [ ] Validates 6-digit OTP format
- [ ] Clamps TTL to 1-60 minutes

### email.send.reset.password
- [ ] Sends reset link
- [ ] Validates URL format

### email.send.redemption.otp
- [ ] Sends OTP with rewardName and pointsCost
- [ ] Uses green-themed template
- [ ] Validates email format

---

## Guest Sessions

### Guest login
- [ ] Creates guest session with email
- [ ] Sets guest_session cookie
- [ ] 24hr TTL

### Guest upgrade
- [ ] Sends OTP to verify email ownership
- [ ] Sets password after OTP verified
- [ ] Converts to full panelist account
- [ ] Shows message about email being used for OTP and gift cards

---

## Data Integrity

### Points system
- [ ] All point mutations use row-level locks (SELECT FOR UPDATE)
- [ ] currentBalance snapshot stored on every transaction
- [ ] Redemption deduction + refund are atomic
- [ ] Referral bonuses awarded atomically within transaction

### Survey transactions
- [ ] respondentId is unique per survey attempt
- [ ] completedAt only set on completion
- [ ] awardedPoints matches survey config for each status
