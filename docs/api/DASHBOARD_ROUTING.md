# Dynamic Dashboard Routing by User Type

## Overview
The application now supports dynamic dashboard routing based on user type. When users log in, they are automatically redirected to their appropriate dashboard.

## User Types and Their Dashboards

| User Type  | Dashboard URL          | Description                                    |
|------------|------------------------|------------------------------------------------|
| **Admin**  | `/admin/dashboard`     | Full system administration and analytics       |
| **Panelist** | `/dashboard`         | Survey participation, points, and rewards      |
| **Client** | `/client/dashboard`    | Survey management and results (future)         |
| **Moderator** | `/moderator/dashboard` | Content moderation and management (future)  |

## Implementation Details

### 1. **Centralized Routing Utility** 
Location: `src/lib/utils/dashboard-routing.ts`

```typescript
getDashboardUrl(userType: string): string
```
Returns the appropriate dashboard URL based on user type.

```typescript
canAccessRoute(userType: string, pathname: string): boolean
```
Checks if a user has permission to access a specific route.

```typescript
getRoleName(userType: string): string
```
Returns a user-friendly display name for the role.

### 2. **Server-Side Protection**
Location: `src/hooks.server.ts`

**Features:**
- ✅ Authentication check for all protected routes
- ✅ Role-based access control
- ✅ Automatic redirection to appropriate dashboard
- ✅ Preserves redirect URL in query params for login
- ✅ Admin users can access all routes
- ✅ Regular users restricted to their designated areas

**Protected Routes:**
- `/dashboard` - Panelist dashboard (panelists and admins only)
- `/admin/*` - Admin panel (admins only)
- `/client/*` - Client dashboard (clients and admins only)
- `/moderator/*` - Moderator dashboard (moderators and admins only)
- `/profile`, `/surveys`, `/points`, `/history`, `/rewards` - Panelist features

### 3. **Client-Side Layouts**

#### Panelist Layout
Location: `src/routes/(panelist)/+layout.svelte`

**Features:**
- ✅ Checks authentication status
- ✅ Verifies user type (panelist or admin)
- ✅ Redirects unauthorized users to their dashboard
- ✅ Preserves redirect URL for login
- ✅ Comprehensive logging of access attempts

#### Admin Layout
Location: `src/routes/admin/+layout.svelte`

**Features:**
- ✅ Admin-only access
- ✅ Admin navigation menu
- ✅ User role badge display
- ✅ Logout functionality

### 4. **Authentication Flow**

#### Login Process (`src/routes/(public)/login/+page.svelte`)
```
1. User enters credentials
2. Login successful → Get user type
3. Redirect to appropriate dashboard:
   - admin → /admin/dashboard
   - panelist → /dashboard
   - client → /client/dashboard
   - moderator → /moderator/dashboard
```

#### Register Process (`src/routes/(public)/register/+page.svelte`)
```
1. User registers
2. Registration successful → Get user type
3. Redirect to appropriate dashboard (same logic as login)
```

## Usage Examples

### Example 1: Admin Login
```
1. Admin logs in at /login
2. System detects userType = 'admin'
3. Redirects to /admin/dashboard
4. Admin can access all routes
```

### Example 2: Panelist Accessing Admin Route
```
1. Panelist tries to access /admin/dashboard
2. hooks.server.ts checks canAccessRoute()
3. Returns false (panelist can't access admin)
4. Redirects to /dashboard (panelist dashboard)
```

### Example 3: Unauthenticated Access
```
1. Guest tries to access /dashboard
2. hooks.server.ts detects no authentication
3. Redirects to /login?redirect=/dashboard
4. After login, redirects back to /dashboard
```

## Access Control Matrix

| Route                | Admin | Panelist | Client | Moderator | Guest |
|---------------------|-------|----------|--------|-----------|-------|
| `/`                 | ✅    | ✅       | ✅     | ✅        | ✅    |
| `/login`            | ✅    | ✅       | ✅     | ✅        | ✅    |
| `/register`         | ✅    | ✅       | ✅     | ✅        | ✅    |
| `/dashboard`        | ✅    | ✅       | ❌     | ❌        | ❌    |
| `/admin/*`          | ✅    | ❌       | ❌     | ❌        | ❌    |
| `/client/*`         | ✅    | ❌       | ✅     | ❌        | ❌    |
| `/moderator/*`      | ✅    | ❌       | ❌     | ✅        | ❌    |
| `/surveys`          | ✅    | ✅       | ❌     | ❌        | ❌    |
| `/profile`          | ✅    | ✅       | ❌     | ❌        | ❌    |
| `/points`           | ✅    | ✅       | ❌     | ❌        | ❌    |

## Security Features

### 1. **Double Protection**
- Server-side protection in `hooks.server.ts`
- Client-side validation in layout components
- Prevents unauthorized access at multiple levels

### 2. **Comprehensive Logging**
All access attempts are logged with:
- User ID
- User type
- Route attempted
- Timestamp
- Success/failure status

### 3. **Session Validation**
- All requests validate session cookies
- Invalid sessions are cleared immediately
- Users redirected to login for expired sessions

## Testing Recommendations

### Test Cases:

1. **Admin User**
   - [ ] Can access `/admin/dashboard`
   - [ ] Can access `/dashboard` (panelist area)
   - [ ] Can access all protected routes
   - [ ] Sees "ADMIN" badge in navigation

2. **Panelist User**
   - [ ] Can access `/dashboard`
   - [ ] Cannot access `/admin/dashboard` (redirected)
   - [ ] Can access surveys, profile, points
   - [ ] Cannot access client/moderator routes

3. **Unauthenticated User**
   - [ ] Redirected to `/login` from protected routes
   - [ ] Redirect URL preserved in query params
   - [ ] After login, redirected to original destination

4. **Cross-User Type Access**
   - [ ] Client cannot access panelist routes
   - [ ] Moderator cannot access admin routes
   - [ ] Proper error logging for unauthorized attempts

## Future Enhancements

### 1. Client Dashboard
- Create `/client/dashboard` route
- Survey creation and management
- Results analytics
- Billing and invoicing

### 2. Moderator Dashboard
- Create `/moderator/dashboard` route
- Content moderation tools
- User management
- Reporting system

### 3. Enhanced Permissions
- Granular permissions within user types
- Feature flags per user
- Custom role creation
- Permission inheritance

## Troubleshooting

### Issue: User stuck in redirect loop
**Solution:** Check session validation in `hooks.server.ts`

### Issue: User redirected to wrong dashboard
**Solution:** Verify `userType` field in user object

### Issue: Access denied for valid user
**Solution:** Check `canAccessRoute()` logic and user type spelling

## Related Files

- `src/lib/utils/dashboard-routing.ts` - Routing utility
- `src/hooks.server.ts` - Server middleware
- `src/routes/(panelist)/+layout.svelte` - Panelist layout
- `src/routes/admin/+layout.svelte` - Admin layout
- `src/routes/(public)/login/+page.svelte` - Login page
- `src/routes/(public)/register/+page.svelte` - Register page
- `src/lib/stores/auth.svelte.ts` - Auth store
- `src/lib/types/auth.ts` - Auth types
