# Geo-Restriction Quick Reference

## 🚀 Getting Started in 3 Steps

### Step 1: Configure Countries
Edit `/src/lib/server/geo-restriction.ts`:

```typescript
export const GEO_CONFIG = {
  mode: 'allowlist', // or 'blocklist'
  
  // Add your allowed countries (2-letter ISO codes)
  allowedCountries: [
    'US', 'CA', 'GB', 'AU', 'IN', 'PH', 'SG', 'MY'
  ],
  
  blockVPN: true,  // Block VPN/proxy
  blockTOR: true,  // Block TOR network
};
```

### Step 2: Deploy Behind Cloudflare (Recommended)
- Instant country detection
- Free on all plans
- Zero rate limits

### Step 3: Test & Monitor
```bash
# Test with curl
curl -H "cf-ipcountry: CN" http://localhost:5173/api/panelist/dashboard
```

Visit `/admin/geo-settings` to manage via UI.

---

## 🎯 Common Tasks

### Change Restriction Mode
```typescript
mode: 'allowlist'  // Only allow specified countries
mode: 'blocklist'  // Block specified countries, allow others
```

### Add/Remove Countries
```typescript
allowedCountries: ['US', 'CA', 'GB'], // Add country codes
blockedCountries: ['KP', 'IR', 'SY'], // Or block specific ones
```

### Exempt Paths
```typescript
exemptPaths: [
  '/api/analytics/*',  // Wildcard support
  '/',                 // Homepage
  '/about',           // Public pages
]
```

### Enable/Disable Security
```typescript
blockVPN: true,   // Block VPN/proxy connections
blockTOR: true,   // Block TOR exit nodes
```

---

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| **Blocked Page** | `/geo-blocked` |
| **Admin Settings** | `/admin/geo-settings` |
| **Analytics API** | `/api/admin/geo-analytics` |
| **Settings API** | `/api/admin/geo-settings` |

---

## 🌍 Popular Country Codes

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

[Full list →](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

---

## 🔧 Detection Methods

### Cloudflare (Recommended) ⚡
- **Speed:** Instant (edge)
- **Cost:** Free
- **Setup:** Deploy behind Cloudflare
- **VPN Detection:** No (use fallback)

### ip-api.com (Fallback) 🔄
- **Speed:** ~200ms
- **Cost:** Free (45 req/min)
- **Setup:** Already configured
- **VPN Detection:** Yes

### ipinfo.io (Optional) 💎
- **Speed:** ~150ms
- **Cost:** 50k/month free
- **Setup:** Add API token
- **VPN Detection:** Yes (best)

---

## 🛡️ Security Features

✅ Country-based blocking
✅ VPN/Proxy detection
✅ TOR network blocking
✅ Request path exemptions
✅ Rate limit safe
✅ Development exemption
✅ Comprehensive logging

---

## 📊 Response Formats

### Blocked API Request
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
**Status:** `403 Forbidden`

### Blocked Page Request
**Action:** Redirect to `/geo-blocked`
**Message:** Friendly error page with reason

---

## 🧪 Testing Commands

```bash
# Test blocked country
curl -H "cf-ipcountry: CN" http://localhost:5173/dashboard

# Test allowed country
curl -H "cf-ipcountry: US" http://localhost:5173/dashboard

# Test VPN detection (requires real VPN)
# Connect to VPN → Visit site → Should be blocked

# Test admin panel
# Login as admin → Visit /admin/geo-settings
```

---

## 📈 Monitoring

### Console Logs (Development)
```javascript
console.log('Geo-Restriction Event:', {
  ipAddress: '1.2.3.4',
  country: 'US',
  allowed: true,
  // ...
});
```

### Database Logs (Production)
```sql
SELECT * FROM geo_restriction_logs
WHERE allowed = false
ORDER BY created_at DESC
LIMIT 100;
```

### Analytics API
```bash
curl http://localhost:5173/api/admin/geo-analytics?days=7
```

---

## ⚡ Performance

| Method | Latency |
|--------|---------|
| Cloudflare | ~0ms |
| ip-api | ~200ms |
| ipinfo.io | ~150ms |
| Local (MaxMind) | ~5ms |

**Tip:** Use Cloudflare in production for best performance.

---

## 🚨 Troubleshooting

### All Users Blocked
- Check `allowedCountries` is not empty
- Verify mode is set correctly
- Check logs for actual country code

### VPN Not Detected
- Upgrade to ipinfo.io
- Enable `blockVPN: true`
- Some residential VPNs are hard to detect

### Location Unknown Error
- Check API rate limits
- Verify Cloudflare integration
- Add localhost exemption

### Settings Not Working
- Restart server after config changes
- Clear browser cache
- Check hooks.server.ts integration

---

## 📚 Documentation

- **Full Guide:** `GEO_RESTRICTION.md`
- **Implementation:** `GEO_RESTRICTION_SUMMARY.md`
- **Setup Script:** `scripts/setup-geo-restriction.sh`

---

## 🆘 Quick Help

**Issue:** User in wrong country blocked
**Fix:** Add country code to `allowedCountries`

**Issue:** VPN bypassing restriction
**Fix:** Set `blockVPN: true` and use ipinfo.io

**Issue:** Public page blocked
**Fix:** Add path to `exemptPaths`

**Issue:** Too many API calls
**Fix:** Use Cloudflare (free, unlimited)

**Issue:** Need to override for specific user
**Fix:** Add logic in `checkGeoRestriction()`

---

## ✅ Pre-Deployment Checklist

- [ ] Configure allowed/blocked countries
- [ ] Set up Cloudflare integration
- [ ] Test with VPN from different countries
- [ ] Add exempt paths for public endpoints
- [ ] Enable database logging (optional)
- [ ] Update terms of service
- [ ] Train support team
- [ ] Monitor logs after launch

---

## 🎉 You're Ready!

The geo-restriction system is **active and running**.

Configure your countries in `geo-restriction.ts` and you're all set! 🌍
