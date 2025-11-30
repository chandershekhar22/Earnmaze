# Unique User Tracking Implementation

## Overview

This implementation tracks **unique users** across multiple sessions and visits using a combination of:
1. **Persistent User ID** - Stored in localStorage
2. **Browser Fingerprinting** - For cookieless tracking
3. **Session ID** - For individual visit sessions

## How It Works

### 1. **User ID (Persistent)**
Stored in **localStorage** and survives across:
- ✅ Multiple sessions
- ✅ Browser restarts
- ✅ Different days/weeks
- ❌ Different browsers
- ❌ Different devices
- ❌ Private/incognito mode (clears on close)

**Storage Location:** `localStorage.analytics_user_id`

**Format:** `user_1730851234567_abc123xyz`

### 2. **Session ID (Temporary)**
Stored in **sessionStorage** for 30 minutes:
- ✅ Single browsing session
- ❌ Survives tab close
- ❌ Survives browser restart

**Storage Location:** `sessionStorage.analytics_session_id`

**Format:** `sess_1730851234567_abc123xyz`

### 3. **Browser Fingerprint (Cookieless)**
Generated from device characteristics:
- Screen resolution
- Timezone
- Language
- Platform/OS
- CPU cores
- Device memory
- Canvas fingerprint
- WebGL renderer
- User agent

**Purpose:** Track users even without cookies/localStorage (privacy mode, cookie blockers)

## Tracking Levels

```
User (userId) 
  └─ Multiple Sessions (sessionId)
      └─ Multiple Visits
          └─ Multiple Events (CTA clicks, conversions)
```

### Example User Journey:

```
Day 1, 10:00 AM (First Visit)
├─ userId: user_123
├─ sessionId: sess_001
├─ fingerprint: 8a7f3b2c
└─ Action: Views page, clicks CTA

Day 1, 10:05 AM (Same Session)
├─ userId: user_123
├─ sessionId: sess_001  ← Same session (within 30 min)
└─ Action: Submits email

Day 1, 3:00 PM (New Session)
├─ userId: user_123  ← Same user
├─ sessionId: sess_002  ← New session (>30 min gap)
└─ Action: Returns to page

Day 5 (Returns after 4 days)
├─ userId: user_123  ← Still same user!
├─ sessionId: sess_003
└─ Action: Checks status
```

## Metrics Tracked

### Total vs Unique Metrics

| Metric | Total | Unique |
|--------|-------|--------|
| **Visits** | Every page load | COUNT(DISTINCT userId) |
| **Conversions** | Every email submit | COUNT(DISTINCT userId) |
| **Conversion Rate** | conversions / visits | unique_conversions / unique_users |

### Key Insights

**Total Conversion Rate:** Percentage of all visits that convert
```sql
SELECT (COUNT(*) FROM conversions) / (COUNT(*) FROM visits) * 100
-- Example: 125 conversions / 1000 visits = 12.5%
```

**Unique User Conversion Rate:** Percentage of users who eventually convert
```sql
SELECT COUNT(DISTINCT userId FROM conversions) / COUNT(DISTINCT userId FROM visits) * 100
-- Example: 100 unique users / 850 unique users = 11.8%
```

## Database Schema

### Tables with User Tracking

#### `page_visits`
```typescript
{
  userId: "user_123",           // Persistent user identifier
  sessionId: "sess_001",         // Current session
  fingerprint: "8a7f3b2c",      // Browser fingerprint
  // ... other fields
}
```

#### `email_conversions`
```typescript
{
  userId: "user_123",           // Same user as visit
  sessionId: "sess_001",         // Session when converted
  email: "user@example.com",
  // ... other fields
}
```

#### `cta_clicks`
```typescript
{
  userId: "user_123",           // User who clicked
  sessionId: "sess_001",         // Session when clicked
  buttonLocation: "hero",
  // ... other fields
}
```

## Privacy Considerations

### What We Track
- ✅ Anonymous user ID (not personally identifiable)
- ✅ Technical device information
- ✅ Browser fingerprint (hashed)
- ✅ IP address (can be anonymized)
- ✅ Email (with explicit consent only)

### Privacy Features
- User ID is **anonymous** (not linked to real identity)
- Fingerprint is **hashed** (SHA-256)
- All tracking is **first-party** (no external trackers)
- GDPR compliant with consent
- Can implement "Do Not Track" header respect

### Anonymization Options

If privacy is a concern, you can:

1. **Hash the User ID:**
```typescript
const userId = await hashString(getUserId());
```

2. **Anonymize IP Addresses:**
```typescript
// In track-visit endpoint
const ipAddress = anonymizeIP(getClientAddress());

function anonymizeIP(ip: string): string {
  // IPv4: Remove last octet (192.168.1.xxx → 192.168.1.0)
  // IPv6: Remove last 80 bits
  return ip.replace(/\.\d+$/, '.0');
}
```

3. **Respect DNT Header:**
```typescript
if (request.headers.get('DNT') === '1') {
  // Skip fingerprinting
  fingerprint = null;
}
```

## Analytics Queries

### Get Unique Users Count
```typescript
const uniqueUsers = await db
  .select({ count: sql`count(DISTINCT ${pageVisits.userId})` })
  .from(pageVisits);
```

### Get Returning Users
```typescript
const returningUsers = await db
  .select({
    userId: pageVisits.userId,
    visitCount: sql`count(*)`
  })
  .from(pageVisits)
  .groupBy(pageVisits.userId)
  .having(sql`count(*) > 1`);
```

### Average Sessions Per User
```typescript
const avgSessions = await db
  .select({
    avgSessions: sql`avg(session_count)`
  })
  .from(
    db.select({
      userId: pageVisits.userId,
      sessionCount: sql`count(DISTINCT ${pageVisits.sessionId})`
    })
    .from(pageVisits)
    .groupBy(pageVisits.userId)
    .as('user_sessions')
  );
```

### User Journey Analysis
```typescript
const userJourney = await db
  .select({
    userId: pageVisits.userId,
    firstVisit: sql`min(${pageVisits.visitedAt})`,
    lastVisit: sql`max(${pageVisits.visitedAt})`,
    totalVisits: sql`count(*)`,
    totalSessions: sql`count(DISTINCT ${pageVisits.sessionId})`,
    converted: sql`EXISTS(
      SELECT 1 FROM ${emailConversions} 
      WHERE ${emailConversions.userId} = ${pageVisits.userId}
    )`
  })
  .from(pageVisits)
  .groupBy(pageVisits.userId);
```

### Cohort Analysis (Users by First Visit Date)
```typescript
const cohorts = await db
  .select({
    cohortDate: sql`date_trunc('day', min(${pageVisits.visitedAt}))`,
    users: sql`count(DISTINCT ${pageVisits.userId})`,
    conversions: sql`count(DISTINCT CASE 
      WHEN ${emailConversions.userId} IS NOT NULL 
      THEN ${pageVisits.userId} 
    END)`
  })
  .from(pageVisits)
  .leftJoin(emailConversions, eq(pageVisits.userId, emailConversions.userId))
  .groupBy(sql`date_trunc('day', min(${pageVisits.visitedAt}))`);
```

## Testing User Tracking

### Test Different User Scenarios

1. **New User (First Visit)**
```bash
# Open in normal browser
# Check localStorage: analytics_user_id should be created
```

2. **Returning User (Same Browser)**
```bash
# Close and reopen browser
# Check localStorage: Same user_id should persist
```

3. **New Session (Same User)**
```bash
# Wait 31 minutes or clear sessionStorage
# userId should stay same, sessionId should change
```

4. **Private/Incognito Mode**
```bash
# Open in incognito
# New userId created (doesn't persist after close)
# Fingerprint can still identify as likely same user
```

5. **Different Device/Browser**
```bash
# Open on different device
# New userId created (expected behavior)
```

## Browser Fingerprint Accuracy

### Uniqueness Rates
- Desktop browsers: **~94% unique**
- Mobile browsers: **~81% unique**

### Limitations
- Can change if user updates browser/OS
- Less unique on mobile devices
- Can be blocked by privacy extensions
- Not 100% accurate for user identification

### Best Practices
Use fingerprint as **supplementary** data:
- Primary: `userId` (localStorage)
- Secondary: `sessionId` (sessionStorage)
- Fallback: `fingerprint` (for cookieless tracking)

## Migration from Existing Schema

If you already have analytics data without userId:

```sql
-- Add userId column with default value
ALTER TABLE page_visits 
ADD COLUMN user_id VARCHAR(255) 
DEFAULT 'user_legacy_' || gen_random_uuid();

-- Later, update with actual tracking
UPDATE page_visits 
SET user_id = 'user_actual_id' 
WHERE session_id = 'matching_session';
```

## Dashboard Integration

The analytics dashboard now shows:

1. **Total Visits** - All page views
2. **Unique Users** - COUNT(DISTINCT userId)
3. **Total Conversions** - All email submissions
4. **Unique Converting Users** - COUNT(DISTINCT userId from conversions)
5. **Visit Conversion Rate** - conversions / visits
6. **User Conversion Rate** - unique_conversions / unique_users

## API Response Example

```json
{
  "summary": {
    "totalVisits": 1250,
    "uniqueUsers": 850,
    "totalConversions": 125,
    "uniqueConvertingUsers": 100,
    "conversionRate": 10.0,
    "uniqueConversionRate": 11.76,
    "totalCtaClicks": 450,
    "ctaClickRate": 36.0,
    "avgTimeToConvert": 45
  }
}
```

## Performance Considerations

- User ID lookup: **O(1)** - localStorage read
- Fingerprint generation: **~50-100ms** - Canvas/WebGL rendering
- Database queries: **Indexed on userId** for fast lookups

### Optimization Tips

1. **Index userId column:**
```sql
CREATE INDEX idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX idx_email_conversions_user_id ON email_conversions(user_id);
```

2. **Cache fingerprint:**
```typescript
// Generate once, store in sessionStorage
if (!sessionStorage.getItem('fingerprint')) {
  const fp = await getBrowserFingerprint();
  sessionStorage.setItem('fingerprint', fp);
}
```

3. **Async tracking:**
```typescript
// Don't block page render
trackPageVisit().catch(console.error);
```

## Troubleshooting

### Issue: Users not persisting
**Solution:** Check if localStorage is enabled/allowed

### Issue: Different userIds for same user
**Solution:** User cleared cookies/localStorage, or using different browser

### Issue: Fingerprint keeps changing
**Solution:** User updating browser, changing screen resolution, or using VPN

### Issue: Privacy extensions blocking tracking
**Solution:** Implement graceful fallback, respect DNT header
