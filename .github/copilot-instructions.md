# EarnMaze Panel - AI Coding Assistant Guide

## Project Overview

**EarnMaze Panel** is a SvelteKit 2 application (using Svelte 5 with runes) for managing survey panels. It's a role-based system supporting panelists, admins, clients, and moderators with survey participation, points tracking, and rewards redemption.

**Stack:** SvelteKit 2 + Svelte 5 (runes) + TypeScript + Drizzle ORM + PostgreSQL + Node.js adapter + Docker

## Critical: Svelte 5 Runes Architecture

**This project uses Svelte 5 runes - NOT traditional stores in components:**

### Store Pattern (stores are `.svelte.ts` files)
```typescript
// src/lib/stores/auth.svelte.ts
class AuthStore {
  state = $state<AuthState>({ user: null, isLoading: false, error: null });
  
  async login(credentials: LoginCredentials) { /* ... */ }
  async logout() { /* ... */ }
}
export const authStore = new AuthStore();
```

**Usage in components:**
```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  
  // Access reactive state - NO $ prefix needed
  const user = authStore.state.user;
  
  // Call methods directly
  function handleLogin() {
    authStore.login(credentials);
  }
</script>

{#if authStore.state.user}
  <p>Welcome {authStore.state.user.name}</p>
{/if}
```

### Component State with Runes
```typescript
// Local state
let email = $state('');
let mounted = $state(false);

// Computed values
let isValid = $derived(email.includes('@'));
let redirectUrl = $derived.by(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || '/dashboard';
});

// Side effects
$effect(() => {
  if (mounted && !authChecked) {
    authStore.checkAuth();
  }
});
```

### Event Handlers (Svelte 5 style)
```svelte
<!-- Use property syntax, not directives -->
<button onclick={handleClick}>Click</button>
<form onsubmit={handleSubmit}>...</form>

<script>
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault(); // Handle modifiers manually
    // ...
  }
</script>
```

**DO NOT:**
- ❌ Use `on:click={handler}` (Svelte 4 syntax)
- ❌ Import runes: `import { $state } from 'svelte'` (they're built-in)
- ❌ Use `$authStore.user` (old store syntax)
- ❌ Use `$:` reactive declarations (use `$derived` or `$effect`)

## Path Aliases (Always Use These)

```typescript
'$lib'         → './src/lib'
'$components'  → './src/lib/components'
'$server'      → './src/lib/server'
'$db'          → './src/lib/db'
'$stores'      → './src/lib/stores'
'$types'       → './src/lib/types'
'$utils'       → './src/lib/utils'
'$validation'  → './src/lib/validation'
```

## Database & ORM (Drizzle)

**Schema location:** `src/lib/db/schema/` (modular structure)
**Config:** `drizzle.config.ts` points to `src/lib/db/schema/index.ts`

### Schema Organization
```
src/lib/db/schema/
├── index.ts              # Exports all schemas
├── auth.ts               # users, sessions tables
├── panelists.ts          # panelist profiles
├── surveys.ts            # survey definitions
├── transactions.ts       # points/rewards transactions
└── analytics.ts          # tracking tables
```

### Working with Database

```bash
# Generate migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (dev only - skips migrations)
npm run db:push

# Initialize admin user
npm run admin:init
```

**Schema example:**
```typescript
export const user = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  userType: userTypeEnum("user_type").notNull(), // admin, panelist, client, moderator
  // ... audit fields: createdAt, updatedAt, isDeleted, etc.
});
```

## Authentication & Authorization

### Server-Side Guards (Use in API routes)
```typescript
import { requireAuth, requireAdmin, requirePanelist } from '$lib/server/auth/guards';

export const GET: RequestHandler = async (event) => {
  const user = await requireAuth(event);        // Any authenticated user
  const admin = await requireAdmin(event);      // Admin only
  const panelist = await requirePanelist(event);// Panelist only
  // ...
};
```

### Session Handling
```typescript
import { getAuthUser, setSessionCookie, clearSessionCookie } from '$lib/server/auth/session';

const user = await getAuthUser(event); // Returns AuthUser | null
```

### Role-Based Routing

**User roles:** `admin`, `panelist`, `client`, `moderator`

**Route structure:**
```
/dashboard           → Panelist dashboard (panelists + admins)
/admin/*             → Admin panel (admins only)
/client/*            → Client dashboard (clients + admins)
/moderator/*         → Moderator panel (moderators + admins)
```

**Access control:** See `src/lib/utils/dashboard-routing.ts` for routing logic

## Security Features

### Cloudflare Turnstile (CAPTCHA)
- **Component:** `$lib/components/Turnstile.svelte`
- **Server validation:** `$lib/server/turnstile.ts`
- **Enabled on:** Login, Register pages
- **Docs:** `docs/architecture/TURNSTILE_QUICKSTART.md`

```typescript
// In API route
import { validateTurnstileToken } from '$lib/server/turnstile';
const error = await validateTurnstileToken(token, getClientAddress());
if (error) return json({ error }, { status: 400 });
```

### Geo-Restriction
- **Config:** `src/lib/server/geo-restriction.ts`
- **Admin UI:** `/admin/geo-settings`
- **Modes:** allowlist (whitelist) or blocklist
- **Features:** Country filtering, VPN/TOR detection, path exemptions
- **Docs:** `docs/architecture/GEO_RESTRICTION_QUICKREF.md`

```typescript
// Configure in geo-restriction.ts
export const GEO_CONFIG = {
  mode: 'allowlist',
  allowedCountries: ['US', 'CA', 'GB', 'IN', 'PH'],
  blockVPN: true,
  blockTOR: true,
};
```

## Logging System

**Comprehensive logging infrastructure in `src/lib/utils/app-logger.ts`**

### Available Loggers
```typescript
import { Logger, Perf, Features, Security, API } from '$lib/utils/app-logger';

// Contextual logging
Logger.auth.info('User logged in', { userId: '123' });
Logger.api.error('API call failed', { endpoint: '/users', status: 500 });
Logger.database.debug('Query executed', { duration: '45ms' });

// Performance tracking
const opId = Perf.start('data-processing');
// ... do work ...
Perf.end(opId, { recordsProcessed: 100 });

// Feature usage
Features.trackPageView('/dashboard');
Features.trackUserAction('button-click', 'survey-list', { surveyId: '123' });

// Security events
Security.logAuthAttempt('login', 'user@example.com', true);
Security.logSecurityEvent('suspicious-activity', 'high', { reason: 'rate-limit' });
```

**Available contexts:** auth, api, database, ui, performance, security, errors, surveys, analytics

## API Response Patterns

**All API responses use standardized types from `$types/api-responses.ts`:**

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

// Usage in API route
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const result = await doSomething();
    return json({ success: true, data: result });
  } catch (error) {
    return json(
      { success: false, error: 'OPERATION_FAILED', message: error.message },
      { status: 400 }
    );
  }
};
```

## Development Workflow

### Essential Commands
```bash
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm start                # Run production build
npm run check            # Type check
npm test                 # Run tests
npm run db:push          # Update database schema (dev)
npm run admin:init       # Create admin user interactively
```

### Docker Development
```bash
# Start PostgreSQL
docker compose up -d

# Check status
docker ps

# View logs
docker compose logs -f db

# Stop services
docker compose down
```

**Database connection:** `postgres://postgres:postgres@localhost:5432/earnmaze`

## Testing

**Framework:** Vitest + Testing Library (Svelte 5 support)

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
npm run test:coverage # Coverage report
```

**Test location:** `src/test/` for utilities, colocated for component tests

## File Naming Conventions

- **Components:** `PascalCase.svelte`
- **Routes:** SvelteKit convention (`+page.svelte`, `+server.ts`, `+layout.svelte`)
- **Stores:** `kebab-case.svelte.ts` (e.g., `auth.svelte.ts`)
- **Types:** `kebab-case.ts` in `src/lib/types/`
- **Utilities:** `kebab-case.ts` in `src/lib/utils/`
- **Validation:** `kebab-case-validation.ts` in `src/lib/validation/`

## Common Patterns

### API Route Template
```typescript
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth/guards';

export const POST: RequestHandler = async (event) => {
  const user = await requireAuth(event);
  const body = await event.request.json();
  
  try {
    // Validate with Zod
    const validated = schema.parse(body);
    
    // Business logic
    const result = await doSomething(validated);
    
    return json({ success: true, data: result });
  } catch (error) {
    return json(
      { success: false, error: 'ERROR_CODE', message: error.message },
      { status: 400 }
    );
  }
};
```

### Form Handling (Svelte 5)
```svelte
<script lang="ts">
  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    
    const result = await authStore.login({ email, password });
    if (result.success) {
      goto('/dashboard');
    }
    
    isLoading = false;
  }
</script>

<form onsubmit={handleSubmit}>
  <input bind:value={email} type="email" required />
  <input bind:value={password} type="password" required />
  <button type="submit" disabled={isLoading}>Login</button>
</form>
```

## Documentation

**Comprehensive docs in `docs/` directory:**

- `PROJECT_STRUCTURE.md` - Architecture overview
- `logging-system.md` - Logging guide
- `architecture/SVELTE5_MIGRATION_COMPLETE.md` - Svelte 5 migration details
- `architecture/TURNSTILE_QUICKSTART.md` - Captcha setup
- `architecture/GEO_RESTRICTION_QUICKREF.md` - Geo-blocking setup
- `api/DASHBOARD_ROUTING.md` - Role-based routing
- `api/API_RESPONSE_TYPES.md` - API contracts

## Environment Variables

**Required in `.env`:**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/earnmaze
SESSION_SECRET=your-secret-key-here
PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

## Common Gotchas

1. **Svelte 5 runes are NOT imported** - `$state`, `$derived`, `$effect` are built-in compiler features
2. **No `$` prefix on store state** - Use `authStore.state.user` not `$authStore.user`
3. **Event handlers use properties** - `onclick={handler}` not `on:click={handler}`
4. **Always use path aliases** - Import from `$lib`, `$types`, etc., not relative paths
5. **Validate Turnstile tokens** - All public-facing forms should include Turnstile validation
6. **Use auth guards in API routes** - Never rely on client-side auth alone
7. **Database has audit fields** - All tables include `createdAt`, `updatedAt`, `isDeleted`, etc.
8. **Role-based access** - Admins can access all routes, others restricted to their areas

## When Making Changes

- **Adding routes:** Consider role-based access and update `dashboard-routing.ts` if needed
- **Database changes:** Run `npm run db:generate` to create migrations
- **New API endpoints:** Follow response type pattern, add auth guards, validate inputs
- **Store modifications:** Keep `.svelte.ts` extension, use `$state` for reactivity
- **Component creation:** Use Svelte 5 runes, add to appropriate directory in `$components`
- **Security-sensitive changes:** Update logging, consider geo-restrictions, validate thoroughly

## Key Files to Reference

- `src/hooks.server.ts` - Request middleware, auth checks (if exists)
- `src/app.d.ts` - Global type augmentation for SvelteKit
- `svelte.config.js` - SvelteKit configuration, aliases
- `drizzle.config.ts` - Database configuration
- `src/lib/types/api-responses.ts` - API response contracts
- `src/lib/utils/dashboard-routing.ts` - Role-based routing logic
- `src/lib/server/auth/guards.ts` - Authentication guards
