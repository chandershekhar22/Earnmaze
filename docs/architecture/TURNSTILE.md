# Cloudflare Turnstile Integration Guide

## Overview

Cloudflare Turnstile is a user-friendly CAPTCHA alternative that protects your forms from bots and abuse. It's free, privacy-focused, and provides a better user experience than traditional CAPTCHAs.

## Features

✅ **Bot Protection** - Prevents automated attacks on login/register
✅ **Privacy-First** - No user tracking or cookies
✅ **Free** - Unlimited requests on all plans
✅ **User-Friendly** - Most users won't see a challenge
✅ **Lightweight** - Minimal JavaScript overhead
✅ **Accessible** - WCAG 2.1 AA compliant

## Setup

### 1. Get Your Keys

1. Go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/turnstile)
2. Click "Add Site"
3. Configure your site:
   - **Site Name**: Your app name
   - **Domain**: Your domain (or `localhost` for development)
   - **Widget Mode**: Managed (recommended)
4. Copy your **Site Key** (public) and **Secret Key** (private)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Public Site Key (visible in browser)
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Secret Key (server-side only)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**For Development**, use these test keys:
- **Always Pass**: Site Key `1x00000000000000000000AA`, Secret `1x0000000000000000000000000000000AA`
- **Always Block**: Site Key `2x00000000000000000000AB`, Secret `2x0000000000000000000000000000000AA`
- **Interactive Challenge**: Site Key `3x00000000000000000000FF`, Secret `3x0000000000000000000000000000000AA`

### 3. Restart Your Server

```bash
npm run dev
```

## Implementation

### Current Integration

Turnstile is already integrated in:
- ✅ **Login Page** (`/login`)
- ✅ **Register Page** (`/register`)

### Backend Verification

API endpoints automatically verify Turnstile tokens:
- `/api/auth/login` - Validates token before authentication
- `/api/auth/register` - Validates token before creating account

### Add to Other Forms

To add Turnstile to additional forms:

```svelte
<script lang="ts">
  import Turnstile from '$lib/components/Turnstile.svelte';
  
  let turnstileToken = $state<string | null>(null);
  let turnstileRef: any;
  
  function handleTurnstileVerify(token: string) {
    turnstileToken = token;
  }
  
  function handleTurnstileError() {
    turnstileToken = null;
  }
  
  function handleTurnstileExpire() {
    turnstileToken = null;
  }
  
  async function handleSubmit() {
    if (!turnstileToken) {
      alert('Please complete the verification');
      return;
    }
    
    // Send turnstileToken to your API
    const response = await fetch('/api/your-endpoint', {
      method: 'POST',
      body: JSON.stringify({ 
        ...yourData,
        turnstileToken 
      })
    });
    
    if (!response.ok) {
      // Reset on error
      turnstileRef?.reset();
      turnstileToken = null;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <!-- Your form fields -->
  
  <Turnstile
    bind:this={turnstileRef}
    onVerify={handleTurnstileVerify}
    onError={handleTurnstileError}
    onExpire={handleTurnstileExpire}
    theme="auto"
    size="normal"
  />
  
  <button type="submit" disabled={!turnstileToken}>
    Submit
  </button>
</form>
```

### Server-Side Verification

In your API endpoint:

```typescript
import { validateTurnstileToken } from '$lib/server/turnstile';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const { turnstileToken, ...data } = await request.json();
  
  // Verify Turnstile
  const error = await validateTurnstileToken(turnstileToken, getClientAddress());
  if (error) {
    return json({ error }, { status: 400 });
  }
  
  // Continue with your logic...
};
```

## Configuration Options

### Component Props

```typescript
<Turnstile
  onVerify={(token) => {}}      // Called when verification succeeds
  onError={() => {}}            // Called on error
  onExpire={() => {}}           // Called when token expires
  theme="auto"                  // 'light' | 'dark' | 'auto'
  size="normal"                 // 'normal' | 'compact'
  action="login"                // Optional: action name for analytics
  cData="user123"               // Optional: custom data
  appearance="always"           // 'always' | 'execute' | 'interaction-only'
/>
```

### Widget Modes

**Always (Recommended)**
- Widget always visible
- Most users see checkmark instantly
- Some may see interactive challenge

**Execute**
- Invisible widget
- Programmatically triggered
- Good for forms without visual CAPTCHA

**Interaction-Only**
- Only appears when suspicious activity detected
- Best user experience
- May not catch all bots

### Theme Options

- **auto**: Matches user's system preference
- **light**: Light theme
- **dark**: Dark theme

## Testing

### Test with Development Keys

Use these keys to test different scenarios:

**Always Pass** (Default in dev):
```env
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Always Fail** (Test error handling):
```env
PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

**Always Challenge** (Test interactive mode):
```env
PUBLIC_TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=3x0000000000000000000000000000000AA
```

### Manual Testing

1. **Successful Flow**:
   - Fill out login/register form
   - Wait for Turnstile checkmark
   - Submit form
   - Should succeed

2. **Error Handling**:
   - Use "always fail" test keys
   - Try to submit form
   - Should show error message

3. **Token Expiration**:
   - Wait 5 minutes after verification
   - Try to submit
   - Should require re-verification

4. **Network Error**:
   - Block `challenges.cloudflare.com` in DevTools
   - Widget should show error
   - Form submission should be blocked

## Error Handling

### Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `missing-input-secret` | Secret key not provided | Check environment variables |
| `invalid-input-secret` | Secret key is invalid | Verify key in dashboard |
| `missing-input-response` | Token not sent | Ensure token is included in request |
| `invalid-input-response` | Token is invalid/expired | User needs to re-verify |
| `timeout-or-duplicate` | Token already used | Reset widget and get new token |
| `internal-error` | Cloudflare issue | Retry after a moment |

### User-Friendly Messages

The system automatically translates error codes:

- `timeout-or-duplicate` → "CAPTCHA expired or already used. Please try again."
- `invalid-input-response` → "Invalid CAPTCHA response. Please try again."
- `bad-request` → "CAPTCHA verification failed. Please refresh and try again."

## Security Best Practices

### ✅ DO

- **Always verify server-side** - Never trust client-side verification
- **Include IP address** - Helps detect suspicious patterns
- **Reset on error** - Force users to re-verify after failed attempts
- **Rate limit** - Combine with rate limiting for extra protection
- **Log failures** - Monitor for attack patterns

### ❌ DON'T

- **Don't skip verification** - Even if token exists, always verify
- **Don't reuse tokens** - Each submission needs a fresh token
- **Don't trust expired tokens** - Tokens expire after 5 minutes
- **Don't expose secret key** - Never send to client
- **Don't disable in production** - Even for testing

## Performance Impact

- **Initial Load**: ~15-20KB JavaScript
- **Verification Time**: 100-500ms average
- **User Experience**: Instant for most users
- **CDN**: Served from Cloudflare's global edge network

## Privacy

Turnstile is privacy-focused:
- ✅ No personal data collected
- ✅ No tracking cookies
- ✅ GDPR compliant
- ✅ No cross-site tracking
- ✅ Open to privacy audits

## Analytics

View Turnstile analytics in [Cloudflare Dashboard](https://dash.cloudflare.com/turnstile):
- **Solve Rate**: % of users who complete verification
- **Challenge Rate**: % of users who see interactive challenge
- **Error Rate**: % of failed verifications
- **Top Countries**: Geographic distribution

## Troubleshooting

### Widget Not Appearing

**Check**:
1. `PUBLIC_TURNSTILE_SITE_KEY` is set in `.env`
2. Environment variables loaded (restart dev server)
3. Browser console for errors
4. Network tab for `challenges.cloudflare.com` requests

**Fix**: Add to `.env`:
```env
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### "CAPTCHA verification unavailable"

**Cause**: `TURNSTILE_SECRET_KEY` not configured

**Fix**: Add to `.env`:
```env
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### Always Shows Challenge

**Causes**:
- Suspicious IP address
- VPN/Proxy detected
- Bot-like behavior

**Normal Behavior**: Some users will see challenges. This is expected and not an error.

### Verification Fails in Production

**Check**:
1. Domain matches Turnstile dashboard configuration
2. Using production keys (not test keys)
3. HTTPS enabled (required in production)
4. Correct secret key in environment

## Migration from Other CAPTCHAs

### From reCAPTCHA

Turnstile is a drop-in replacement:

**Before (reCAPTCHA)**:
```html
<div class="g-recaptcha" data-sitekey="..."></div>
```

**After (Turnstile)**:
```svelte
<Turnstile onVerify={...} />
```

**Benefits**:
- ✅ No "I'm not a robot" clicks
- ✅ Better privacy
- ✅ Faster verification
- ✅ Free unlimited usage

### From hCaptcha

Similar migration path. Turnstile advantages:
- ✅ Better user experience
- ✅ Cloudflare infrastructure
- ✅ No puzzle solving for most users

## Cost

**Free** ✅
- Unlimited verifications
- All features included
- No credit card required
- Works on all Cloudflare plans (including free)

## Support

- **Documentation**: [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- **Community**: [Cloudflare Community](https://community.cloudflare.com/)
- **Status**: [Cloudflare Status](https://www.cloudflarestatus.com/)

## Advanced Features

### Custom Appearance

Style the container:
```css
.turnstile-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}
```

### Programmatic Execution

```typescript
// Execute verification programmatically
turnstileRef?.execute();

// Get current response token
const token = turnstileRef?.getResponse();

// Reset widget
turnstileRef?.reset();
```

### Action and cData

For analytics and tracking:
```svelte
<Turnstile
  action="user-login"
  cData="session-abc123"
  onVerify={handleVerify}
/>
```

## Summary

Turnstile is now protecting your:
- ✅ Login page
- ✅ Registration page

**Next Steps**:
1. Get production keys from Cloudflare dashboard
2. Update `.env` with your keys
3. Test in development
4. Deploy to production
5. Monitor analytics in Cloudflare dashboard

**Need Help?** Check the troubleshooting section or contact support.
