# Admin Authentication & Authorization Guide

## Overview

The application uses role-based access control (RBAC) with the following user types:
- **admin** - Full system access
- **panelist** - Survey participants
- **client** - Survey creators
- **moderator** - Content moderation

## Route Protection

### Route Groups

```
src/routes/
├── (public)/          ← No authentication required
│   ├── earn-money/
│   ├── register/
│   └── login/
├── (authenticated)/   ← Requires login (any user type)
│   └── dashboard/
└── (admin)/          ← Requires admin role
    ├── analytics/
    ├── users/
    └── surveys/
```

### How It Works

1. **Public Routes** - Accessible to everyone
2. **Authenticated Routes** - Requires valid session token
3. **Admin Routes** - Requires admin role + valid session

## Implementation

### 1. Server-Side Auth Functions

Located in: `src/lib/server/auth.ts`

#### `getAuthUser(event)`
Get current authenticated user from session cookie.

**Returns:** `AuthUser | null`

```typescript
const user = await getAuthUser(event);
if (user) {
  console.log(user.email, user.userType);
}
```

#### `requireAuth(event)`
Require authentication - redirects to login if not authenticated.

**Throws:** `redirect(303, '/login')` if not authenticated

```typescript
const user = await requireAuth(event);
// User is guaranteed to be authenticated here
```

#### `requireAdmin(event)`
Require admin role - returns 403 error if not admin.

**Throws:** 
- `redirect(303, '/login')` if not authenticated
- `error(403, 'Access denied')` if not admin

```typescript
const admin = await requireAdmin(event);
// User is guaranteed to be admin here
```

#### `requireUserType(event, allowedTypes)`
Require specific user type(s).

```typescript
// Allow only admins and moderators
const user = await requireUserType(event, ['admin', 'moderator']);
```

#### `isAdmin(event)`
Boolean check if user is admin (no error thrown).

```typescript
const admin = await isAdmin(event);
if (admin) {
  // Show admin features
}
```

#### `hasRole(event, role)`
Boolean check if user has specific role.

```typescript
const isPanelist = await hasRole(event, 'panelist');
```

### 2. Protecting Page Routes

#### Layout Server Load (`+layout.server.ts`)

Protects all pages in the route group:

```typescript
// src/routes/(admin)/+layout.server.ts
import { requireAdmin } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const user = await requireAdmin(event);
  
  return { user };
};
```

#### Page Server Load (`+page.server.ts`)

Protects individual page:

```typescript
// src/routes/dashboard/+page.server.ts
import { requireAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = await requireAuth(event);
  
  return { user };
};
```

### 3. Protecting API Endpoints

#### Admin-Only API

```typescript
// src/routes/api/analytics/conversions/+server.ts
import { requireAdmin } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  // Require admin authentication
  await requireAdmin(event);
  
  // Admin-only logic here
  const data = await fetchAnalytics();
  return json(data);
};
```

#### Authenticated API

```typescript
// src/routes/api/surveys/my-surveys/+server.ts
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
  const user = await requireAuth(event);
  
  // Use user.id to fetch user-specific data
  const surveys = await getUserSurveys(user.id);
  return json(surveys);
};
```

#### Role-Based API

```typescript
// src/routes/api/surveys/create/+server.ts
import { requireUserType } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  // Only clients and admins can create surveys
  const user = await requireUserType(event, ['client', 'admin']);
  
  const survey = await createSurvey(user.id, data);
  return json(survey);
};
```

### 4. Client-Side Auth Check

Use the existing auth store:

```svelte
<script>
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  
  onMount(() => {
    authStore.checkAuth();
  });
</script>

{#if $authStore.user}
  {#if $authStore.user.userType === 'admin'}
    <a href="/admin/analytics">Analytics</a>
  {/if}
  
  <p>Welcome, {$authStore.user.name}!</p>
{:else}
  <a href="/login">Login</a>
{/if}
```

## Session Management

### Session Token

Stored in HTTP-only cookie: `session_token`

**Properties:**
- Expires: 30 days
- HTTP-only: Yes (prevents XSS)
- Secure: Yes (HTTPS only in production)
- SameSite: Lax

### Session Validation

On every request:
1. Extract session token from cookie
2. Validate token in database
3. Check expiration
4. Check user is active and not deleted
5. Return user data

## Security Features

### 1. Automatic Redirects

```typescript
// Not authenticated
await requireAuth(event);
// → Redirects to /login?redirect=/original-url

// Not admin
await requireAdmin(event);
// → Returns 403 Forbidden error
```

### 2. Soft Delete Protection

Users marked as deleted (`isDeleted: true`) are automatically excluded from authentication.

### 3. Session Expiration

Sessions expire after 30 days and are automatically cleaned up.

### 4. IP Address & User Agent Tracking

Sessions store:
- IP address
- User agent
- Last activity

## Examples

### Example 1: Admin Analytics Dashboard

```typescript
// src/routes/(admin)/analytics/+page.server.ts
import { requireAdmin } from '$lib/server/auth';

export const load = async (event) => {
  const admin = await requireAdmin(event);
  
  // Fetch analytics data
  const stats = await getAnalytics();
  
  return { admin, stats };
};
```

### Example 2: User Dashboard (Any Authenticated User)

```typescript
// src/routes/(authenticated)/dashboard/+page.server.ts
import { requireAuth } from '$lib/server/auth';

export const load = async (event) => {
  const user = await requireAuth(event);
  
  // Fetch user-specific data
  const userData = await getUserData(user.id);
  
  return { user, userData };
};
```

### Example 3: Conditional Admin Features

```typescript
// src/routes/surveys/+page.server.ts
import { getAuthUser } from '$lib/server/auth';

export const load = async (event) => {
  const user = await getAuthUser(event);
  
  const surveys = await getSurveys();
  const canManage = user?.userType === 'admin' || user?.userType === 'client';
  
  return { 
    surveys,
    user,
    canManage
  };
};
```

### Example 4: API with Optional Auth

```typescript
// src/routes/api/surveys/public/+server.ts
import { getAuthUser } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
  const user = await getAuthUser(event);
  
  // Public surveys visible to everyone
  const surveys = await getPublicSurveys();
  
  // Add personalized data if authenticated
  if (user) {
    const userProgress = await getUserProgress(user.id);
    return json({ surveys, userProgress });
  }
  
  return json({ surveys });
};
```

## Testing

### Create Admin User

```typescript
// scripts/create-admin.ts
import { createUser } from '$lib/db/auth-utils';

await createUser({
  email: 'admin@example.com',
  password: 'secure_password',
  name: 'Admin User',
  userType: 'admin'
});
```

### Test Authentication

```bash
# Login as admin
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure_password"}'

# Access admin endpoint (with session cookie)
curl http://localhost:5173/api/analytics/conversions \
  -H "Cookie: session_token=YOUR_TOKEN"
```

## Error Responses

### 401 Unauthorized (Not Authenticated)
```json
{
  "error": "Authentication required"
}
```

Automatically redirects to `/login?redirect=/original-url`

### 403 Forbidden (Wrong Role)
```json
{
  "error": "Access denied. Admin privileges required."
}
```

### 404 Not Found (Invalid Session)
Session expired or invalid token - same as 401.

## Best Practices

1. **Always use server-side auth** - Never trust client-side checks alone
2. **Protect API endpoints** - Even if UI is protected
3. **Use layout guards** - Protect entire route groups
4. **Log admin actions** - Track who did what
5. **Validate sessions** - Check expiration on every request
6. **Use HTTPS** - Protect session cookies in production

## Migration Guide

### Updating Existing Routes

1. **Move admin pages to (admin) group:**
```bash
mv src/routes/analytics src/routes/(admin)/analytics
```

2. **Add layout guard:**
Create `src/routes/(admin)/+layout.server.ts`

3. **Update API endpoints:**
```typescript
// Before
export const GET: RequestHandler = async ({ url }) => {
  // No auth check
}

// After
export const GET: RequestHandler = async (event) => {
  await requireAdmin(event);
  // Protected logic
}
```

## Troubleshooting

### "Authentication required" on admin pages
- Check session cookie exists
- Verify user is logged in
- Check session hasn't expired

### "Access denied" error
- User logged in but doesn't have admin role
- Check `userType` in database

### Session not persisting
- Check cookie settings
- Verify domain matches
- Check HTTPS in production

## Future Enhancements

- [ ] Permissions system (granular access control)
- [ ] Multi-factor authentication (2FA)
- [ ] Role-based UI component library
- [ ] Audit logging for admin actions
- [ ] Session management dashboard
- [ ] IP-based access restrictions
- [ ] Rate limiting per role
