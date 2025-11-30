# Geo-Restriction System

This document explains how to configure and use the geo-restriction system to control which countries can access your platform.

## Features

- ✅ **Country-based access control** - Allow or block specific countries
- ✅ **VPN/Proxy detection** - Block users hiding their location
- ✅ **TOR network blocking** - Prevent TOR exit node access
- ✅ **Path exemptions** - Allow certain paths to bypass restrictions
- ✅ **Cloudflare integration** - Fast country detection using CF headers
- ✅ **Fallback geo-IP lookup** - Uses ip-api.com when CF headers unavailable
- ✅ **Admin dashboard** - Easy management via web UI
- ✅ **Logging & analytics** - Track restriction events

## Configuration

### 1. Configure Allowed/Blocked Countries

Edit `/src/lib/server/geo-restriction.ts`:

```typescript
export const GEO_CONFIG = {
	// Choose restriction mode
	mode: 'allowlist' as 'allowlist' | 'blocklist',
	
	// Allowed countries (when mode = 'allowlist')
	allowedCountries: [
		'US', // United States
		'CA', // Canada
		'GB', // United Kingdom
		'AU', // Australia
		// ... add more countries
	],
	
	// Blocked countries (when mode = 'blocklist')
	blockedCountries: [
		'KP', // North Korea
		'IR', // Iran
		// ... add more countries
	],
	
	// Security options
	blockVPN: true,   // Block VPN/proxy connections
	blockTOR: true,   // Block TOR network
};
```

### 2. Exemption Paths

Some paths may need to bypass geo-restrictions (e.g., analytics, tracking):

```typescript
exemptPaths: [
	'/api/analytics/conversions',
	'/api/track-visit',
	'/api/track-cta',
	'/api/save-email',
	'/',
	'/about',
	'/earn-money',
],
```

### 3. Restriction Modes

#### Allowlist Mode (Recommended)
- **Default behavior:** Deny all countries
- **Explicit allow:** Only specified countries can access
- **Use case:** When you want tight control (e.g., compliance requirements)

```typescript
mode: 'allowlist',
allowedCountries: ['US', 'CA', 'GB', 'AU'],
```

#### Blocklist Mode
- **Default behavior:** Allow all countries
- **Explicit deny:** Only specified countries are blocked
- **Use case:** When you want open access except for specific regions

```typescript
mode: 'blocklist',
blockedCountries: ['KP', 'IR', 'SY'],
```

## Deployment Options

### Option 1: Cloudflare (Recommended)

**Advantages:**
- ✅ Fastest performance (edge detection)
- ✅ No API rate limits
- ✅ Free on all Cloudflare plans
- ✅ Most accurate

**Setup:**
1. Deploy your app behind Cloudflare
2. Country is automatically detected from `cf-ipcountry` header
3. No additional configuration needed

### Option 2: ip-api.com (Free Tier)

**Advantages:**
- ✅ No Cloudflare required
- ✅ VPN/proxy detection included
- ✅ Free tier: 45 requests/minute

**Limitations:**
- ⚠️ Rate limited (45/min for non-commercial use)
- ⚠️ Adds ~100-300ms latency

**Setup:**
Already configured as fallback when Cloudflare headers unavailable.

### Option 3: ipinfo.io (Paid/Free Tier)

**Advantages:**
- ✅ 50,000 requests/month free
- ✅ VPN/TOR/proxy detection
- ✅ Better accuracy

**Setup:**
1. Sign up at https://ipinfo.io
2. Get API token
3. Update code to use `getGeoLocationIPInfo()` instead:

```typescript
// In geo-restriction.ts, replace:
const location = await getGeoLocation(ipAddress);

// With:
const location = await getGeoLocationIPInfo(ipAddress, 'YOUR_TOKEN_HERE');
```

### Option 4: MaxMind GeoIP2 (Self-hosted)

**Advantages:**
- ✅ No API calls (local database)
- ✅ Fastest after Cloudflare
- ✅ No rate limits
- ✅ Most privacy-friendly

**Setup:**
1. Download MaxMind GeoLite2 database
2. Install `@maxmind/geoip2-node`
3. Implement local lookup function

## API Response Format

When a user is geo-restricted, API endpoints return:

```json
{
  "success": false,
  "error": "REGION_RESTRICTED",
  "message": "Service not available in your country",
  "data": {
    "country": "XX",
    "reason": "Service not available in your country"
  }
}
```

HTTP Status: `403 Forbidden`

## User Experience

### For Blocked Users

1. **API Requests:** Return 403 JSON response
2. **Page Requests:** Redirect to `/geo-blocked` page
3. **Error Page:** Shows friendly message with:
   - Reason for restriction
   - Try again button
   - Contact support link

### For Allowed Users

No impact - requests processed normally.

## Admin Management

Access the admin dashboard at: `/admin/geo-settings`

Features:
- Switch between allowlist/blocklist mode
- Add/remove countries
- Enable/disable VPN/TOR blocking
- Manage exempt paths
- Real-time preview of settings

## Testing

### Test in Development

Development IPs (localhost, 192.168.x.x, 10.x.x.x) are automatically exempted.

### Test with VPN

1. Enable VPN
2. Visit your site
3. Should see geo-blocked page (if VPN blocking enabled)

### Test Specific Country

Use Cloudflare's test headers or VPN to specific country.

### Test with curl

```bash
# Simulate blocked country
curl -H "cf-ipcountry: KP" https://your-site.com/api/panelist/dashboard

# Simulate allowed country
curl -H "cf-ipcountry: US" https://your-site.com/api/panelist/dashboard
```

## Monitoring & Logging

All geo-restriction events are logged:

```typescript
{
  timestamp: "2025-11-09T12:00:00.000Z",
  ipAddress: "1.2.3.4",
  country: "XX",
  city: "City Name",
  allowed: false,
  reason: "Service not available in your country",
  pathname: "/api/panelist/dashboard",
  isVPN: true,
  isTOR: false
}
```

### Store Logs to Database

Implement `logGeoRestrictionEvent()` to save to your database:

```typescript
// In geo-restriction.ts
export async function logGeoRestrictionEvent(...) {
  // Save to database
  await db.insert(geoRestrictionLogs).values({
    ipAddress,
    country: location?.countryCode,
    allowed,
    reason,
    pathname,
    timestamp: new Date(),
  });
}
```

## Performance Impact

| Method | Latency | Notes |
|--------|---------|-------|
| Cloudflare Headers | ~0ms | Instant (edge) |
| ip-api.com | ~100-300ms | API call |
| ipinfo.io | ~50-200ms | API call |
| MaxMind Local | ~1-5ms | Local lookup |

**Recommendation:** Use Cloudflare for production.

## Security Considerations

### Bypass Attempts

Users may try to bypass restrictions:

1. **VPN/Proxy** - Detected and blocked (if enabled)
2. **TOR** - Detected and blocked (if enabled)
3. **Header spoofing** - Not possible (Cloudflare sets headers)
4. **Direct server access** - Use firewall rules

### Best Practices

- ✅ Use Cloudflare to prevent header spoofing
- ✅ Enable VPN/TOR blocking for critical operations
- ✅ Exempt only public/non-sensitive paths
- ✅ Monitor logs for suspicious patterns
- ✅ Use allowlist mode for compliance-critical apps

## Country Codes (ISO 3166-1 alpha-2)

Common country codes:

| Code | Country |
|------|---------|
| US | United States |
| CA | Canada |
| GB | United Kingdom |
| AU | Australia |
| IN | India |
| PH | Philippines |
| SG | Singapore |
| MY | Malaysia |
| ZA | South Africa |
| NG | Nigeria |
| KE | Kenya |
| PK | Pakistan |
| BD | Bangladesh |

Full list: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

## Compliance

### GDPR (EU)

If blocking EU countries, ensure:
- Clear communication about restrictions
- Contact method for inquiries
- Data processing transparency

### Local Regulations

Check local laws regarding:
- Geographic discrimination
- Service accessibility requirements
- Data sovereignty

## Troubleshooting

### "Location Unknown" Error

**Causes:**
- IP detection failed
- API rate limit exceeded
- Invalid IP address

**Solutions:**
1. Check Cloudflare integration
2. Verify API rate limits
3. Add localhost exemption for dev

### VPN Not Being Detected

**Causes:**
- Using ip-api.com (limited detection)
- VPN using residential IPs

**Solutions:**
1. Upgrade to ipinfo.io (better detection)
2. Use MaxMind GeoIP2 with proxy database
3. Implement additional fraud detection

### All Users Blocked

**Causes:**
- Empty allowed list in allowlist mode
- Configuration error

**Solutions:**
1. Check `allowedCountries` array
2. Verify restriction mode
3. Check exempt paths

## Migration Checklist

Before enabling in production:

- [ ] Configure allowed/blocked countries
- [ ] Set up Cloudflare (recommended)
- [ ] Test with VPN from different countries
- [ ] Add exempt paths for public endpoints
- [ ] Update error pages
- [ ] Set up logging/monitoring
- [ ] Train support team on geo-restrictions
- [ ] Update terms of service
- [ ] Communicate to users (if needed)

## Support

For issues or questions:
- Check logs in browser console (dev)
- Check terminal output (server-side)
- Review `logGeoRestrictionEvent()` output
- Contact your admin team

## Future Enhancements

Potential improvements:
- Database-backed configuration (no restart needed)
- Per-user country overrides
- Time-based restrictions (e.g., maintenance windows)
- Regional content delivery
- A/B testing by country
- Automatic fraud score calculation
