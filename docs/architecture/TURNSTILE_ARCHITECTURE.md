# Turnstile Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Login/Register Page (+page.svelte)              │  │
│  │                                                          │  │
│  │  ┌────────────────┐                                     │  │
│  │  │  Email Input   │                                     │  │
│  │  └────────────────┘                                     │  │
│  │                                                          │  │
│  │  ┌────────────────┐                                     │  │
│  │  │ Password Input │                                     │  │
│  │  └────────────────┘                                     │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │     Turnstile Component (Turnstile.svelte)     │    │  │
│  │  │                                                  │    │  │
│  │  │  1. Loads Cloudflare script                    │    │  │
│  │  │  2. Renders widget                              │    │  │
│  │  │  3. User completes verification ✓               │    │  │
│  │  │  4. Receives token from Cloudflare              │    │  │
│  │  │  5. Calls onVerify(token) callback              │    │  │
│  │  │                                                  │    │  │
│  │  │  Token: "0.ABC123...XYZ789"                     │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  ┌────────────────┐                                     │  │
│  │  │ Submit Button  │  (disabled until token exists)     │  │
│  │  └────────────────┘                                     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ POST /api/auth/login                │
│                           │ { email, password, turnstileToken } │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR SERVER (SVELTEKIT)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        API Endpoint (+server.ts)                        │  │
│  │                                                          │  │
│  │  1. Receives request with turnstileToken                │  │
│  │                                                          │  │
│  │  2. Calls validateTurnstileToken()                      │  │
│  │     ↓                                                    │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  turnstile.ts (Server Verification)           │    │  │
│  │  │                                                 │    │  │
│  │  │  - Checks token exists                        │    │  │
│  │  │  - Checks TURNSTILE_SECRET_KEY configured     │    │  │
│  │  │  - Makes POST to Cloudflare API ──────────────┼────┼──┐
│  │  │  - Validates response                          │    │  │
│  │  │  - Returns null (success) or error message     │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │     │                                                    │  │
│  │     ▼                                                    │  │
│  │  3. If valid: Continue with login/register             │  │
│  │     If invalid: Return 400 error                        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFLARE TURNSTILE API                           │
│        https://challenges.cloudflare.com/turnstile              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /turnstile/v0/siteverify                                  │
│                                                                 │
│  Body:                                                          │
│  {                                                              │
│    "secret": "1x0000000000000000000000000000000AA",           │
│    "response": "0.ABC123...XYZ789",                           │
│    "remoteip": "192.168.1.1"                                   │
│  }                                                              │
│                                                                 │
│  Response:                                                      │
│  {                                                              │
│    "success": true,                                            │
│    "challenge_ts": "2025-11-09T21:30:00Z",                    │
│    "hostname": "localhost",                                    │
│    "error-codes": []                                           │
│  }                                                              │
│                                                                 │
│  Validates:                                                     │
│  ✓ Token not expired (<5 minutes old)                         │
│  ✓ Token not already used                                     │
│  ✓ Token issued by correct site key                           │
│  ✓ IP address matches (optional)                              │
│  ✓ User behavior analysis passed                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Summary

### 1. **User Interaction** (Browser)
```
User visits /login
  ↓
Turnstile widget loads
  ↓
User completes verification (usually automatic ✓)
  ↓
Token stored: turnstileToken = "0.ABC..."
  ↓
Submit button enabled
```

### 2. **Form Submission** (Browser → Server)
```
User clicks submit
  ↓
POST /api/auth/login
{
  email: "user@example.com",
  password: "secret123",
  turnstileToken: "0.ABC..."
}
```

### 3. **Server Verification** (Your Server)
```
Receive request
  ↓
Extract turnstileToken
  ↓
Call validateTurnstileToken(token, ip)
  ↓
Make POST to Cloudflare API
  ↓
Cloudflare validates token
  ↓
Return success/failure
```

### 4. **Token Verification** (Cloudflare)
```
Receive verification request
  ↓
Check secret key valid
  ↓
Check token exists in database
  ↓
Check token not expired
  ↓
Check token not already used
  ↓
Check IP matches (optional)
  ↓
Analyze user behavior
  ↓
Return { success: true/false }
```

### 5. **Response** (Server → Browser)
```
If token valid:
  Continue with login/register
  Create session
  Return user data
  
If token invalid:
  Return 400 error
  Show error message
  Reset Turnstile widget
  User must re-verify
```

## Security Layers

```
┌─────────────────────────────────────┐
│  Layer 1: Client-Side Protection   │
│  - Widget visible to user           │
│  - Submit disabled without token    │
│  - Token automatically expires      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Layer 2: Transport Security        │
│  - HTTPS encryption                 │
│  - Token sent in POST body          │
│  - IP address included              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Layer 3: Server Validation         │
│  - Token presence checked           │
│  - Secret key verified              │
│  - Cloudflare API called            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Layer 4: Cloudflare Verification   │
│  - Token authenticity                │
│  - One-time use enforced             │
│  - Expiration checked                │
│  - Behavior analysis                 │
└─────────────────────────────────────┘
```

## Token Lifecycle

```
1. CREATION (Browser)
   Cloudflare generates unique token
   "0.ABC123...XYZ789"
   Valid for: 5 minutes
   ────────────────────────────────────
   
2. STORAGE (Browser State)
   turnstileToken = "0.ABC..."
   Stored in component state
   Cleared on error/expire
   ────────────────────────────────────
   
3. TRANSMISSION (Network)
   Sent in POST body
   Encrypted via HTTPS
   Includes IP address
   ────────────────────────────────────
   
4. VERIFICATION (Cloudflare)
   Check not expired ✓
   Check not used ✓
   Check valid secret ✓
   Mark as used ✓
   ────────────────────────────────────
   
5. INVALIDATION
   After 5 minutes: Expired
   After use: Consumed
   On error: Reset required
   ────────────────────────────────────
```

## File Dependencies

```
Browser Side:
  Turnstile.svelte
    ↓ imports
  window.turnstile (from Cloudflare CDN)
    ↓ calls
  challenges.cloudflare.com/turnstile/v0/api.js
    ↓ verifies user
  Returns token


Server Side:
  +server.ts (API endpoint)
    ↓ imports
  turnstile.ts (validation logic)
    ↓ uses
  env.TURNSTILE_SECRET_KEY
    ↓ calls
  challenges.cloudflare.com/turnstile/v0/siteverify
    ↓ validates token
  Returns success/failure
```

## Protected Routes

```
/login (Page)
  ↓ calls
  POST /api/auth/login (API)
    ↓ validates with
    Turnstile ✓

/register (Page)
  ↓ calls
  POST /api/auth/register (API)
    ↓ validates with
    Turnstile ✓
```

## Environment Variables

```
.env
├── PUBLIC_TURNSTILE_SITE_KEY    (Client-side, visible)
│   Used by: Turnstile.svelte
│   Purpose: Load widget, get tokens
│
└── TURNSTILE_SECRET_KEY          (Server-side, private)
    Used by: turnstile.ts
    Purpose: Verify tokens with Cloudflare
```

## Error Flow

```
Token Missing
  ↓
"Please complete CAPTCHA"
  ↓
Submit button disabled
────────────────────────

Token Invalid
  ↓
Cloudflare rejects
  ↓
Server returns 400
  ↓
Widget resets
  ↓
User re-verifies
────────────────────────

Token Expired (>5min)
  ↓
Cloudflare rejects
  ↓
"CAPTCHA expired, try again"
  ↓
Widget resets
────────────────────────

Network Error
  ↓
"CAPTCHA unavailable"
  ↓
User retries
```
