# Quick Reference Guide

Fast lookup for common development patterns, APIs, and configurations.

**Last Updated:** February 1, 2026

---

## 📑 Table of Contents

- [Security Patterns](#security-patterns)
- [Database Operations](#database-operations)
- [Authentication](#authentication)
- [API Development](#api-development)
- [Validation Schemas](#validation-schemas)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)

---

## Security Patterns

### Input Validation

```typescript
import { validateInput, loginSchema } from '$lib/validation/api-schemas';

const result = await validateInput(loginSchema, body, true);
if (!result.success) {
  return json({ error: result.error }, { status: 400 });
}
const { email, password } = result.data;
```

### Rate Limiting

```typescript
import { 
  authRateLimit,      // 5 req/15min, block 1h
  strictRateLimit,    // 10 req/15min, block 30min
  standardRateLimit,  // 100 req/15min
  publicRateLimit,    // 1000 req/15min
  burstRateLimit      // 5 req/sec
} from '$lib/server/rate-limit';

const rateLimitResponse = await authRateLimit(event);
if (rateLimitResponse) return rateLimitResponse;
```

### CSRF Protection

```typescript
import { csrfMiddleware, setSecurityHeaders } from '$lib/server/security';

// In hooks.server.ts
if (['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
  const csrfResponse = await csrfMiddleware(event);
  if (csrfResponse) return csrfResponse;
}
```

### Attack Detection

```typescript
import { detectAttackPattern, sanitizeHtml } from '$lib/server/security';

const attack = detectAttackPattern(userInput);
if (attack.detected) {
  return json({ error: 'Invalid input' }, { status: 400 });
}

const safe = sanitizeHtml(userInput);
```

---

## Database Operations

### Transactions with Retry

```typescript
import { withTransaction } from '$lib/server/database';

const result = await withTransaction(async (tx) => {
  const user = await tx.insert(users).values(data).returning();
  await tx.insert(profiles).values({ userId: user[0].id });
  return user[0];
}, { maxRetries: 3, retryDelay: 1000 });
```

### Query Caching

```typescript
import { cachedQuery, queryCache } from '$lib/server/database';

// Cache query (5 min default TTL)
const activeUsers = await cachedQuery(
  'active-users',
  () => db.query.users.findMany({ where: eq(users.isActive, true) }),
  300000
);

// Invalidate cache
queryCache.invalidate('active-users');
queryCache.invalidate('user:*'); // Pattern matching
queryCache.clear(); // Clear all
```

### Performance Monitoring

```typescript
import { monitorQuery } from '$lib/server/database';

const results = await monitorQuery(
  'complex-analytics',
  () => db.query.analytics.findMany(...),
  2000 // Log if > 2 seconds
);
```

### Common Queries

```typescript
import { db } from '$lib/db';
import { users, sessions, surveys } from '$lib/db/schema';
import { eq, and, gt, lt, like, desc } from 'drizzle-orm';

// Find by ID
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});

// Find with relations
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    sessions: true,
    profile: true
  }
});

// List with filters
const activeUsers = await db.query.users.findMany({
  where: and(
    eq(users.isActive, true),
    eq(users.userType, 'panelist')
  ),
  orderBy: desc(users.createdAt),
  limit: 10,
  offset: 0
});

// Update
await db.update(users)
  .set({ lastLoginAt: new Date() })
  .where(eq(users.id, userId));

// Delete
await db.delete(sessions)
  .where(lt(sessions.expiresAt, new Date()));

// Count
const count = await db.select({ count: sql<number>`count(*)` })
  .from(users)
  .where(eq(users.isActive, true));
```

---

## Authentication

### Require Auth

```typescript
import { requireAuth, requireAdmin } from '$lib/server/auth';

// Require any authenticated user
export const load = requireAuth(async ({ locals }) => {
  const user = locals.user; // Guaranteed to exist
  return { user };
});

// Require admin user
export const load = requireAdmin(async ({ locals }) => {
  const admin = locals.user; // Guaranteed to be admin
  return { admin };
});
```

### Session Management

```typescript
import { createSession, deleteSession, getSession } from '$lib/server/auth';

// Create session
const session = await createSession(userId, userAgent, ipAddress);
event.cookies.set('session', session.token, {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});

// Get session
const session = await getSession(token);

// Delete session
await deleteSession(token);
event.cookies.delete('session', { path: '/' });
```

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '$lib/server/auth';

// Hash password
const hash = await hashPassword(password);

// Verify password
const valid = await verifyPassword(password, hash);
```

---

## API Development

### Standard API Route

```typescript
import { type RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { validateInput, mySchema } from '$lib/validation/api-schemas';
import { standardRateLimit } from '$lib/server/rate-limit';
import { handleError, successResponse } from '$lib/server/error-handler';
import { setSecurityHeaders } from '$lib/server/security';

export const POST: RequestHandler = async (event) => {
  try {
    // Rate limiting
    const rateLimitResponse = await standardRateLimit(event);
    if (rateLimitResponse) return rateLimitResponse;
    
    // Validation
    const body = await event.request.json();
    const result = await validateInput(mySchema, body, true);
    if (!result.success) {
      return json({ error: result.error }, { status: 400 });
    }
    
    // Business logic
    const data = await processRequest(result.data);
    
    // Success response
    const response = successResponse(data, 'Operation successful');
    return setSecurityHeaders(response);
    
  } catch (error) {
    return handleError(error, 'api-endpoint', event);
  }
};
```

### Error Responses

```typescript
import { ApiError } from '$lib/server/error-handler';

// Standard errors
throw new ApiError('USER_NOT_FOUND', 'User not found');
throw new ApiError('INVALID_INPUT', 'Invalid email format');
throw new ApiError('FORBIDDEN', 'Insufficient permissions');
throw new ApiError('RATE_LIMIT_EXCEEDED', 'Too many requests');

// Custom error
throw new Error('Something went wrong');
```

---

## Validation Schemas

### Available Schemas

```typescript
import {
  // Auth
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  
  // Guest
  guestLoginSchema,
  upgradeStartSchema,
  upgradeVerifySchema,
  upgradeSetPasswordSchema,
  
  // Surveys
  createSurveySchema,
  updateSurveySchema,
  surveyResponseSchema,
  surveyFilterSchema,
  
  // Admin
  updateUserSchema,
  updateSettingsSchema,
  analyticsFilterSchema,
  
  // Rewards
  redeemRewardSchema,
  transactionFilterSchema,
  
  // Analytics
  trackVisitSchema,
  trackClickSchema,
  trackTimeSchema
} from '$lib/validation/api-schemas';
```

### Custom Validation

```typescript
import { z } from 'zod';

const mySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  website: z.string().url().optional(),
  tags: z.array(z.string()).max(10)
});

type MyData = z.infer<typeof mySchema>;
```

---

## Error Handling

### Standard Error Codes

```typescript
// Authentication (401)
'AUTH_REQUIRED'          // Authentication required
'INVALID_CREDENTIALS'    // Invalid email or password
'SESSION_EXPIRED'        // Session expired
'EMAIL_NOT_VERIFIED'     // Email verification required

// Authorization (403)
'FORBIDDEN'              // Insufficient permissions

// Input (400)
'INVALID_INPUT'          // Invalid input data
'MISSING_FIELD'          // Required field missing
'INVALID_EMAIL'          // Invalid email format
'WEAK_PASSWORD'          // Password too weak

// Resources (404, 409)
'NOT_FOUND'              // Resource not found
'USER_NOT_FOUND'         // User not found
'SURVEY_NOT_FOUND'       // Survey not found
'DUPLICATE_ENTRY'        // Resource already exists

// Rate Limiting (429)
'RATE_LIMIT_EXCEEDED'    // Too many requests

// Server (500, 502)
'DATABASE_ERROR'         // Database operation failed
'EXTERNAL_SERVICE_ERROR' // External service unavailable
'INTERNAL_ERROR'         // Internal server error
```

### Retry Logic

```typescript
import { retryOperation } from '$lib/server/error-handler';

const result = await retryOperation(
  async () => {
    return await externalAPI.call();
  },
  {
    maxRetries: 3,
    retryDelay: 1000,
    shouldRetry: (error) => error.statusCode === 503
  }
);
```

### Correlation IDs

```typescript
import { generateCorrelationId } from '$lib/server/error-handler';

const correlationId = generateCorrelationId();
Logger.error('Operation failed', { correlationId, error });
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
SESSION_SECRET="random-64-char-string"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="strong-password"

# Security
OTP_PEPPER="random-string-for-otp-hashing"
CSRF_SECRET="random-string-for-csrf-tokens"

# Cloudflare Turnstile
TURNSTILE_SITE_KEY="your-site-key"
TURNSTILE_SECRET_KEY="your-secret-key"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# Optional
NODE_ENV="development"  # or "production"
PORT="5173"
LOG_LEVEL="info"        # debug, info, warn, error
```

### Loading Environment

```typescript
import { env } from '$env/dynamic/private';
import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

// Private variables (server only)
const dbUrl = env.DATABASE_URL;
const secret = env.SESSION_SECRET;

// Public variables (exposed to client)
const siteKey = PUBLIC_TURNSTILE_SITE_KEY;
```

---

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start with specific port
PORT=3000 npm run dev

# Type checking
npm run check
npm run check:watch

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Database

```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Drop database (⚠️ destructive)
npm run db:drop

# Studio (GUI)
npm run db:studio

# Check migration status
npm run db:migrate -- status

# Seed database
npm run db:seed
```

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build Docker image
docker build -t registry.gitlab.com/earnmaze/em-panel:latest .

# Push to registry
docker push registry.gitlab.com/earnmaze/em-panel:latest

# Deploy with Ansible
cd ../em-deploy
ansible-playbook -i inventory.ini 05_em_panel.yaml --ask-become
```

### Testing

```bash
# Run all tests
npm run test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Container Management

```bash
# List containers
podman ps

# View logs
podman logs -f em-panel-container

# Exec into container
podman exec -it em-panel-container sh

# Restart container
podman restart em-panel-container

# Stop container
podman stop em-panel-container

# Remove container
podman rm em-panel-container

# System cleanup
podman system prune -a
```

---

## Import Patterns

### Path Aliases

```typescript
// ✅ Use path aliases
import { User } from '$lib/types';
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/db';
import { validateInput } from '$lib/validation/api-schemas';

// ❌ Avoid relative imports
import { User } from '../../../lib/types';
import { requireAuth } from '../../../lib/server/auth';
```

### Server-Only Imports

```typescript
// Files ending in .server.ts are server-only
import { getUser } from '$lib/db/repositories/user.repository.server';
import { sendEmail } from '$lib/server/email.server';

// These will cause build errors if imported in client code
```

---

## Logging

### Available Loggers

```typescript
import { Logger } from '$lib/utils/app-logger';

// Contextual loggers
Logger.auth.info('User logged in', { userId });
Logger.api.error('API call failed', { endpoint, status: 500 });
Logger.database.debug('Query executed', { sql, duration });
Logger.ui.warn('Component rendering slow', { component });
Logger.security.error('Attack detected', { type, ip });
Logger.errors.error('Unhandled error', { error, context });
```

### Performance Tracking

```typescript
import { Perf } from '$lib/utils/app-logger';

// Method 1: Manual timing
const operationId = Perf.start('data-processing');
// ... work ...
Perf.end(operationId, { recordsProcessed: 100 });

// Method 2: Auto timing
const result = await Perf.measure('api-call', async () => {
  return fetch('/api/data');
}, { endpoint: '/api/data' });
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing: `npm run test`
- [ ] Type checking: `npm run check`
- [ ] Linting: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Secrets secured (no .env in git)

### Build & Push

- [ ] Build container: `docker build -t registry.gitlab.com/earnmaze/em-panel:latest .`
- [ ] Push to registry: `docker push registry.gitlab.com/earnmaze/em-panel:latest`
- [ ] Tag release: `git tag v1.0.0 && git push --tags`

### Deployment

- [ ] Run Ansible playbook: `ansible-playbook -i inventory.ini 05_em_panel.yaml`
- [ ] Verify migrations applied: Check `__drizzle_migrations` table
- [ ] Check container logs: `podman logs em-panel-container`
- [ ] Test health endpoint: `curl https://yourdomain.com/api/health`
- [ ] Verify functionality: Login, create survey, etc.

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Test rate limiting
- [ ] Verify CSRF protection

---

## Troubleshooting

### TypeScript Errors

```bash
# Clear type cache
rm -rf .svelte-kit
npm run check
```

### Database Issues

```bash
# Check connection
psql $DATABASE_URL -c "SELECT version();"

# Check migrations
npm run db:migrate -- status

# Reset database (⚠️ destructive)
npm run db:drop
npm run db:migrate
```

### Container Issues

```bash
# Check container status
podman ps -a

# View logs
podman logs -f em-panel-container

# Restart
podman restart em-panel-container

# Exec into container
podman exec -it em-panel-container sh
```

### Rate Limiting Issues

```typescript
// Clear rate limit for IP
import { clearRateLimit } from '$lib/server/rate-limit';
clearRateLimit('192.168.1.100', 'auth');
```

---

## Related Documentation

- **[Security Implementation](./SECURITY_IMPLEMENTATION.md)** - Complete security guide
- **[Project Structure](./PROJECT_STRUCTURE.md)** - Codebase organization
- **[Authentication](./features/authentication.md)** - Auth system details
- **[Database Setup](./setup/database-setup.md)** - PostgreSQL configuration

---

**Last Updated:** February 1, 2026  
**Maintained By:** EarnMaze Development Team
