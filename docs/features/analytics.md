# Landing Page Analytics Implementation

## Overview
Complete conversion tracking and traffic source analytics for the `/earn-money` landing page.

## Features Implemented

### 1. **Conversion Tracking**
- Track email captures as conversions
- Calculate conversion rates
- Monitor time-to-convert metrics
- Link conversions to traffic sources

### 2. **Traffic Source Tracking**
- UTM parameters (source, medium, campaign, term, content)
- Referrer detection
- Landing page tracking
- Session-based tracking

### 3. **User Behavior Analytics**
- CTA button click tracking by location (hero vs final-cta)
- Device type detection (mobile, tablet, desktop)
- Browser detection
- Operating system detection
- IP address capture for geo-location

### 4. **Analytics Dashboard**
- Real-time conversion metrics
- Traffic source breakdown
- Device and browser statistics
- CTA performance comparison
- Average time to convert

## Database Schema

### Tables Created

#### `page_visits`
Tracks every visit to the landing page:
- Session ID (unique per 30-min session)
- UTM parameters
- Referrer URL
- Device/browser information
- IP address for geo-location
- Timestamp

#### `email_conversions`
Tracks successful email captures:
- Email address
- Session ID
- Link to original visit
- UTM source (denormalized)
- Time to convert (in seconds)
- Conversion timestamp

#### `cta_clicks`
Tracks CTA button clicks:
- Session ID
- Button location (hero, final-cta)
- Link to visit record
- Click timestamp

## API Endpoints

### `POST /api/track-visit`
Track page visit with traffic source data.

**Payload:**
```json
{
  "sessionId": "sess_1234567890_abc123",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "summer_sale",
  "utm_term": "earn money surveys",
  "utm_content": "ad_variant_a",
  "referrer": "https://google.com",
  "landingPage": "/earn-money",
  "userAgent": "Mozilla/5.0...",
  "deviceType": "mobile",
  "browserName": "Chrome",
  "osName": "Android"
}
```

### `POST /api/track-cta`
Track CTA button clicks.

**Payload:**
```json
{
  "sessionId": "sess_1234567890_abc123",
  "buttonLocation": "hero"
}
```

### `POST /api/save-email`
Save email and track conversion.

**Payload:**
```json
{
  "email": "user@example.com",
  "sessionId": "sess_1234567890_abc123",
  "utmParams": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_sale"
  },
  "timeToConvert": 45
}
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "/register?email=user@example.com"
}
```

### `GET /api/analytics/conversions`
Get comprehensive analytics data.

**Query Parameters:**
- `from` - Start date (ISO format, optional)
- `to` - End date (ISO format, optional)

**Response:**
```json
{
  "summary": {
    "totalVisits": 1250,
    "totalConversions": 125,
    "conversionRate": 10.0,
    "totalCtaClicks": 450,
    "ctaClickRate": 36.0,
    "avgTimeToConvert": 45
  },
  "trafficSources": [...],
  "conversionsBySource": [...],
  "deviceBreakdown": [...],
  "browserBreakdown": [...],
  "ctaPerformance": [...]
}
```

## Usage Examples

### Track Landing Page Visit
The tracking is automatic on page load:

```typescript
import { onMount } from 'svelte';
import { trackPageVisit, markVisitStart } from '$lib/utils/analytics';

onMount(() => {
  markVisitStart();
  trackPageVisit();
});
```

### Track CTA Click
Automatically tracked when buttons are clicked:

```typescript
function openEmailModal(e: Event) {
  const button = e.target as HTMLElement;
  const location = button.closest('section')?.querySelector('h1') ? 'hero' : 'final-cta';
  trackCtaClick(location);
  // ... rest of modal logic
}
```

### Track Email Conversion
Automatically tracked on form submission:

```typescript
async function handleSubmit(e: Event) {
  const sessionId = getSessionId();
  const utmParams = getUtmParams();
  const timeToConvert = getTimeToConvert();
  
  const response = await fetch('/api/save-email', {
    method: 'POST',
    body: JSON.stringify({ 
      email,
      sessionId,
      utmParams,
      timeToConvert
    })
  });
}
```

## Key Metrics Calculated

### Conversion Rate
```
Conversion Rate = (Total Conversions / Total Visits) × 100
```

### CTA Click-Through Rate
```
CTR = (Total CTA Clicks / Total Visits) × 100
```

### Average Time to Convert
Average time (in seconds) from first visit to email submission.

### Traffic Source Performance
Compare conversion rates across different UTM sources to identify best-performing channels.

## Testing URLs

Test the tracking with different traffic sources:

### Google Ads
```
/earn-money?utm_source=google&utm_medium=cpc&utm_campaign=survey_rewards&utm_term=earn+money&utm_content=ad_variant_a
```

### Facebook
```
/earn-money?utm_source=facebook&utm_medium=social&utm_campaign=summer_promo
```

### Email Campaign
```
/earn-money?utm_source=newsletter&utm_medium=email&utm_campaign=june_2025
```

### Affiliate
```
/earn-money?utm_source=affiliate_xyz&utm_medium=referral&utm_campaign=partnership
```

## Analytics Dashboard

View all analytics at: `/analytics`

The dashboard displays:
- Total visits and conversions
- Conversion rate percentage
- CTA click-through rate
- Average time to convert
- Traffic sources with visit counts
- Conversion breakdown by source
- Device and browser statistics
- CTA button performance comparison

## Session Management

Sessions are managed using `sessionStorage`:
- Session ID generated on first visit
- Valid for 30 minutes
- Automatically renewed on activity
- Tied to all tracking events

## Privacy Considerations

- IP addresses stored for geo-location (can be anonymized)
- Emails stored with explicit consent
- GDPR compliant (mentioned in modal)
- No third-party tracking scripts
- All data stored in your database

## Database Migration

To create the analytics tables:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

## Performance Notes

- All tracking calls are non-blocking
- Failed tracking doesn't affect user experience
- Uses `sessionStorage` for client-side state
- Minimal overhead on page load

## Future Enhancements

Potential improvements:
1. Add geo-location enrichment using IP address
2. Implement A/B testing framework
3. Add funnel visualization
4. Create custom event tracking
5. Add email engagement tracking (opens, clicks)
6. Implement cohort analysis
7. Add predictive conversion scoring
8. Create automated reporting
