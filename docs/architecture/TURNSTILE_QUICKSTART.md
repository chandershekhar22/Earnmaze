# Turnstile Quick Start

## 1. Get Keys (2 minutes)

Visit: https://dash.cloudflare.com/turnstile

**For Development (instant)**:
```env
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**For Production**:
1. Click "Add Site"
2. Enter your domain
3. Copy keys

## 2. Add to .env

```env
PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

## 3. Restart Server

```bash
npm run dev
```

## 4. Test

Visit `/login` or `/register` - you should see the Turnstile widget!

---

## Already Implemented On

✅ Login page (`/login`)
✅ Register page (`/register`)

---

## Add to Another Form

```svelte
<script>
  import Turnstile from '$lib/components/Turnstile.svelte';
  
  let token = $state(null);
  let ref;
</script>

<Turnstile
  bind:this={ref}
  onVerify={(t) => token = t}
  onError={() => token = null}
  onExpire={() => token = null}
/>
```

Then in your API:
```ts
import { validateTurnstileToken } from '$lib/server/turnstile';

const error = await validateTurnstileToken(token, getClientAddress());
if (error) return json({ error }, { status: 400 });
```

---

## Test Keys

**Always Pass** (default):
```
Site: 1x00000000000000000000AA
Secret: 1x0000000000000000000000000000000AA
```

**Always Fail**:
```
Site: 2x00000000000000000000AB
Secret: 2x0000000000000000000000000000000AA
```

**Always Challenge**:
```
Site: 3x00000000000000000000FF
Secret: 3x0000000000000000000000000000000AA
```

---

## Troubleshooting

**Widget not showing?**
- Check `.env` has `PUBLIC_TURNSTILE_SITE_KEY`
- Restart dev server

**Verification fails?**
- Check `.env` has `TURNSTILE_SECRET_KEY`
- Verify keys are correct

**Need help?**
See `TURNSTILE.md` for full documentation.
