# Guest Sessions & Account Upgrade - Complete Guide

**Status:** ✅ Production Ready  
**Last Updated:** December 21, 2025  
**Build Status:** ✅ 0 errors  

---

## 📋 Quick Navigation

- [Guest Session Overview](#guest-session-overview)
- [Guest Upgrade Flow](#guest-upgrade-flow)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Testing Guide](#testing-guide)

**Related Documentation:**
- [Authentication](./authentication.md) - Full auth system
- [Security Implementation](../SECURITY_IMPLEMENTATION.md) - Security features
- [Quick Reference](../QUICK_REFERENCE.md) - Common patterns

---

## Guest Session Overview

### What is a Guest Session?

Anonymous sessions that allow users to:
- Browse surveys without registration
- Participate in limited surveys
- Upgrade to full account later

### Features

- ✅ **Device Fingerprinting**: Unique identification per device
- ✅ **Auto-Expiry**: 30-day default expiration
- ✅ **Activity Tracking**: Last activity timestamp
- ✅ **Upgrade Path**: Convert to full account with email verification

### Use Cases

1. **Quick Surveys**: Allow participation without registration friction
2. **Trial Experience**: Let users test platform before committing
3. **Mobile-First**: Simplify mobile onboarding
4. **Conversion Funnel**: Upgrade guests to registered users

---

## Guest Upgrade Flow

### 3-Step Upgrade Process

```
Guest Dashboard
      ↓
  Upgrade Button
      ↓
╔═════════════════════════════════════╗
║ STEP 1: Email Verification          ║
║ - Enter email address                ║
║ - Complete Turnstile CAPTCHA         ║
║ - Send OTP via email                 ║
║ - OTP valid 10 minutes               ║
╚═════════════════════════════════════╝
      ↓
╔═════════════════════════════════════╗
║ STEP 2: Verify Code                 ║
║ - Enter 6-digit OTP code             ║
║ - Max 5 verification attempts        ║
║ - Receive upgrade token              ║
║ - Token valid 15 minutes             ║
╚═════════════════════════════════════╝
      ↓
╔═════════════════════════════════════╗
║ STEP 3: Set Password                ║
║ - Create account password            ║
║ - Min 8 chars (strength rules)       ║
║ - Auto-login after creation          ║
║ - Redirect to dashboard              ║
╚═════════════════════════════════════╝
      ↓
  Full Account (Logged In)
```

### Implementation Files

**Frontend:**
- [routes/guest/upgrade/+page.svelte](../../src/routes/guest/upgrade/+page.svelte) (492 lines)

**Backend API:**
- [api/guest/upgrade/start/+server.ts](../../src/routes/api/guest/upgrade/start/+server.ts)
- [api/guest/upgrade/verify/+server.ts](../../src/routes/api/guest/upgrade/verify/+server.ts)
- [api/guest/upgrade/set-password/+server.ts](../../src/routes/api/guest/upgrade/set-password/+server.ts)

**Repository:**
- [db/repositories/guest-upgrade-verification.repository.server.ts](../../src/lib/db/repositories/guest-upgrade-verification.repository.server.ts)

---

## API Endpoints

### POST /api/guest/login

Create or retrieve guest session.

**Request:**
```typescript
{
  deviceFingerprint: string; // Unique device identifier
}
```

**Response:**
```typescript
{
  success: true;
  guestSessionId: string;
  token: string;
  expiresAt: string; // ISO timestamp
}
```

**Implementation:**
```typescript
// Check existing session
const existing = await db.query.guestSessions.findFirst({
  where: and(
    eq(guestSessions.deviceFingerprint, fingerprint),
    gt(guestSessions.expiresAt, new Date())
  )
});

if (existing) {
  // Update last activity
  await db.update(guestSessions)
    .set({ lastActivity: new Date() })
    .where(eq(guestSessions.id, existing.id));
  return existing;
}

// Create new session
const session = await db.insert(guestSessions).values({
  deviceFingerprint: fingerprint,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  lastActivity: new Date()
}).returning();
```

---

### POST /api/guest/upgrade/start

Initialize account upgrade by sending OTP to email.

**Request:**
```typescript
{
  guestSessionId: string;
  email: string;
  turnstileToken: string; // Cloudflare Turnstile
}
```

**Response:**
```typescript
{
  success: true;
  message: "Verification code sent to email";
  expiresIn: 600; // seconds (10 minutes)
}
```

**Process:**
1. Validate Turnstile token
2. Check if email already registered
3. Generate 6-digit OTP
4. Hash OTP (SHA256 + pepper)
5. Store in database (expires in 10 min)
6. Send email via Celery worker
7. Return success response

**Security:**
- Rate limiting: 5 requests per 15 minutes
- CAPTCHA required (Turnstile)
- OTP hashed before storage
- Email validation (format, length)
- Duplicate email check

---

### POST /api/guest/upgrade/verify

Verify OTP code and get upgrade token.

**Request:**
```typescript
{
  guestSessionId: string;
  code: string; // 6-digit OTP
}
```

**Response:**
```typescript
{
  success: true;
  upgradeToken: string;
  expiresIn: 900; // seconds (15 minutes)
}
```

**Process:**
1. Find verification record
2. Check OTP not expired (10 min)
3. Check attempts < 5
4. Hash submitted code
5. Compare with stored hash
6. Generate upgrade token (UUID)
7. Mark OTP as used
8. Return token

**Security:**
- Max 5 verification attempts
- OTP expires after 10 minutes
- Upgrade token expires after 15 minutes
- One-time use enforcement
- Timing attack prevention

---

### POST /api/guest/upgrade/set-password

Complete upgrade by setting password.

**Request:**
```typescript
{
  upgradeToken: string;
  password: string;
  confirmPassword: string;
}
```

**Response:**
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    userType: "panelist";
  };
  redirectTo: "/dashboard";
}
```

**Process:**
1. Validate upgrade token
2. Check token not expired (15 min)
3. Check token not used
4. Validate password strength
5. Create user account (or update if exists)
6. Mark token as used
7. Create user session
8. Set session cookie
9. Return user data

**Security:**
- Token expires after 15 minutes
- One-time token use
- Password strength validation:
  - Min 8 characters
  - Uppercase + lowercase
  - Number + special character
- Argon2 password hashing
- Secure session cookie (HttpOnly, SameSite)

---

## Database Schema

### guest_sessions

Tracks anonymous guest sessions.

```sql
CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_guest_session_token (device_fingerprint),
  INDEX idx_guest_session_expires_at (expires_at),
  INDEX idx_guest_session_last_activity (last_activity)
);
```

**Fields:**
- `device_fingerprint`: Unique device identifier from browser
- `expires_at`: Session expiration (30 days default)
- `last_activity`: Last API call timestamp
- `created_at`: Session creation time

---

### guest_upgrade_verifications

Tracks OTP and upgrade tokens for account conversion.

```sql
CREATE TABLE guest_upgrade_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id UUID NOT NULL REFERENCES guest_sessions(id),
  email VARCHAR(255) NOT NULL,
  
  -- OTP fields
  otp_hash VARCHAR(255) NOT NULL,
  otp_expires_at TIMESTAMP NOT NULL,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Upgrade token fields
  upgrade_token VARCHAR(255) UNIQUE,
  token_expires_at TIMESTAMP,
  token_used BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Indexes
  INDEX idx_guest_upgrade_session_id (guest_session_id),
  INDEX idx_guest_upgrade_email (email),
  INDEX idx_guest_upgrade_token (upgrade_token),
  INDEX idx_guest_upgrade_otp_expires_at (otp_expires_at)
);
```

**Lifecycle:**
1. **Start**: Create record with OTP hash
2. **Verify**: Update with upgrade token on success
3. **Complete**: Mark token as used
4. **Cleanup**: Soft delete expired records

---

## Security Features

### 1. Device Fingerprinting

```typescript
// Client-side fingerprinting
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();
const fingerprint = result.visitorId;
```

**Purpose:**
- Unique device identification
- Prevent session sharing
- Track guest across pages

---

### 2. OTP Security

**Generation:**
```typescript
// Generate 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```

**Hashing:**
```typescript
import crypto from 'crypto';

const pepper = process.env.OTP_PEPPER; // Secret from env
const hash = crypto
  .createHash('sha256')
  .update(otp + pepper)
  .digest('hex');
```

**Why SHA256?**
- Fast verification needed
- Short-lived (10 min expiry)
- Low iteration count acceptable
- Rate limiting provides brute force protection

---

### 3. Attempt Limiting

```typescript
// Check attempts before verification
if (record.verificationAttempts >= 5) {
  throw new Error('Too many attempts');
}

// Increment on each attempt
await db.update(guestUpgradeVerifications)
  .set({ verificationAttempts: record.verificationAttempts + 1 })
  .where(eq(guestUpgradeVerifications.id, record.id));
```

**Protection:**
- Max 5 attempts per OTP
- Requires new OTP after exceeding limit
- Prevents brute force attacks

---

### 4. Token Expiration

**OTP Expiry:** 10 minutes
```typescript
otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
```

**Upgrade Token Expiry:** 15 minutes
```typescript
tokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
```

**Validation:**
```typescript
if (new Date() > record.otpExpiresAt) {
  throw new Error('OTP expired');
}
```

---

### 5. One-Time Use Enforcement

```typescript
// Check token not already used
if (record.tokenUsed) {
  throw new Error('Token already used');
}

// Mark as used after successful upgrade
await db.update(guestUpgradeVerifications)
  .set({ tokenUsed: true })
  .where(eq(guestUpgradeVerifications.id, record.id));
```

---

## Testing Guide

### Prerequisites

```bash
# Terminal 1: Start em-panel
cd em-panel
npm run dev

# Terminal 2: Start em-worker (for emails)
cd em-worker
python run_worker.py
```

### Test Flow

#### 1. Create Guest Session

```bash
curl -X POST http://localhost:5173/api/guest/login \
  -H "Content-Type: application/json" \
  -d '{"deviceFingerprint": "test-device-123"}'
```

**Expected:**
```json
{
  "success": true,
  "guestSessionId": "uuid-here",
  "token": "session-token",
  "expiresAt": "2025-01-20T..."
}
```

---

#### 2. Start Upgrade

```bash
curl -X POST http://localhost:5173/api/guest/upgrade/start \
  -H "Content-Type: application/json" \
  -d '{
    "guestSessionId": "uuid-from-step-1",
    "email": "test@example.com",
    "turnstileToken": "valid-token"
  }'
```

**Expected:**
- Email sent with 6-digit code
- Response: `{"success": true, "message": "Verification code sent"}`

---

#### 3. Verify OTP

```bash
curl -X POST http://localhost:5173/api/guest/upgrade/verify \
  -H "Content-Type: application/json" \
  -d '{
    "guestSessionId": "uuid-from-step-1",
    "code": "123456"
  }'
```

**Expected:**
```json
{
  "success": true,
  "upgradeToken": "token-here",
  "expiresIn": 900
}
```

---

#### 4. Set Password

```bash
curl -X POST http://localhost:5173/api/guest/upgrade/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "upgradeToken": "token-from-step-3",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#"
  }'
```

**Expected:**
- User account created
- Session cookie set
- Response: `{"success": true, "user": {...}, "redirectTo": "/dashboard"}`

---

### UI Testing

1. Navigate to http://localhost:5173/guest
2. Click "Continue as Guest"
3. Click "Upgrade to Full Account" button
4. Complete 3-step form:
   - Step 1: Enter email, complete CAPTCHA, click "Send Code"
   - Step 2: Enter 6-digit code from email, click "Verify"
   - Step 3: Set password, click "Create Account"
5. Verify redirect to dashboard with logged-in state

---

### Security Testing

**Rate Limiting:**
```bash
# Attempt 6+ requests rapidly
for i in {1..7}; do
  curl -X POST http://localhost:5173/api/guest/upgrade/start \
    -H "Content-Type: application/json" \
    -d '{"guestSessionId": "test", "email": "test@example.com"}';
done
```
**Expected:** 429 Too Many Requests after 5th request

**Attempt Limiting:**
```bash
# Try 6+ invalid OTP codes
for i in {1..6}; do
  curl -X POST http://localhost:5173/api/guest/upgrade/verify \
    -d '{"guestSessionId": "test", "code": "000000"}';
done
```
**Expected:** Error after 5 attempts

**Token Reuse:**
```bash
# Use same upgrade token twice
TOKEN="token-here"
curl -X POST http://localhost:5173/api/guest/upgrade/set-password \
  -d "{\"upgradeToken\": \"$TOKEN\", \"password\": \"Test123!@#\"}";
  
curl -X POST http://localhost:5173/api/guest/upgrade/set-password \
  -d "{\"upgradeToken\": \"$TOKEN\", \"password\": \"Test123!@#\"}";
```
**Expected:** Second request fails with "Token already used"

---

## Troubleshooting

### Email Not Received

**Check:**
1. Celery worker running (`python run_worker.py`)
2. Resend API key configured in `.env`
3. Email queue: `celery -A em-worker inspect active`
4. Worker logs for errors

**Solution:**
```bash
# Check worker logs
tail -f em-worker/celery.log

# Test email task manually
python -c "from tasks_contract import send_verification_email; \
  send_verification_email.delay('test@example.com', '123456', 10)"
```

---

### OTP Always Invalid

**Check:**
1. OTP pepper matches between services
2. Hash algorithm consistent (SHA256)
3. Code format (6 digits, numeric only)

**Debug:**
```typescript
// Add logging to verify endpoint
Logger.debug('OTP verification', {
  submitted: submittedCode,
  hash: hashCode(submittedCode),
  stored: record.otpHash
});
```

---

### Session Cookie Not Set

**Check:**
1. Domain matches (localhost vs 127.0.0.1)
2. HTTPS required for Secure flag
3. SameSite compatibility
4. Cookie size limits

**Solution:**
```typescript
// Adjust cookie settings
event.cookies.set('session', token, {
  path: '/',
  httpOnly: true,
  secure: false, // true in production
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

---

## Related Documentation

- **[Authentication System](./authentication.md)** - Full auth implementation
- **[Security Features](../SECURITY_IMPLEMENTATION.md)** - Security middleware
- **[API Type Safety](../api/API_TYPE_SAFETY_SUMMARY.md)** - TypeScript types
- **[Quick Reference](../QUICK_REFERENCE.md)** - Common patterns

---

**Last Updated:** December 21, 2025  
**Status:** ✅ Production Ready
