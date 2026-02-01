# EarnMaze Panel Documentation

Complete documentation for the EarnMaze survey management and panelist platform.

**Project:** EarnMaze Panel (formerly QS-Panel)  
**Framework:** SvelteKit 2.0 + Svelte 5  
**Database:** PostgreSQL 16 + Drizzle ORM  
**Last Updated:** February 1, 2026

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[Project Structure](./PROJECT_STRUCTURE.md)** - Understand the codebase layout
2. **[Database Setup](./setup/database-setup.md)** - Configure PostgreSQL and run migrations
3. **[Admin Initialization](./setup/admin-initialization.md)** - Create your first admin user
4. **[Authentication Guide](./features/authentication.md)** - Learn the auth system

**Deploy to production:**
- [Deployment Guide](../../em-deploy/README.md) - Ansible playbook documentation

---

## 📚 Documentation Index

### 🔐 Security & Production Readiness

**Priority Reading for Production:**

- **[Security Implementation](./SECURITY_IMPLEMENTATION.md)** - ⭐ Complete security guide
  - Input validation with Zod schemas (20+ endpoints)
  - Rate limiting (5 presets: auth, strict, standard, public, burst)
  - Database optimizations (46 performance indexes)
  - Security middleware (CSRF, headers, sanitization)
  - Error handling (correlation IDs, 20+ error codes)
  - Integration examples and deployment guide

**Status:** ✅ Infrastructure complete, awaiting route integration

---

### ✨ Core Features

| Feature | Documentation | Status |
|---------|--------------|--------|
| **Authentication** | [authentication.md](./features/authentication.md) | ✅ Complete |
| **Guest Sessions** | [GUEST_SESSIONS.md](./features/GUEST_SESSIONS.md) | ✅ Complete |
| **Analytics & Tracking** | [analytics.md](./features/analytics.md) | ✅ Complete |
| **User Tracking** | [user-tracking.md](./features/user-tracking.md) | ✅ Complete |
| **Security Review** | [SECURITY_REVIEW_GUEST_SESSIONS.md](./features/SECURITY_REVIEW_GUEST_SESSIONS.md) | ✅ Complete |

---

### 🏗️ Architecture & Design

| Topic | Documentation | Description |
|-------|--------------|-------------|
| **Turnstile CAPTCHA** | [TURNSTILE_QUICKSTART.md](./architecture/TURNSTILE_QUICKSTART.md) | Quick start guide |
|  | [TURNSTILE_ARCHITECTURE.md](./architecture/TURNSTILE_ARCHITECTURE.md) | Complete implementation |
|  | [TURNSTILE.md](./architecture/TURNSTILE.md) | Usage reference |
| **Geo Restriction** | [GEO_RESTRICTION_QUICKREF.md](./architecture/GEO_RESTRICTION_QUICKREF.md) | Quick reference |
|  | [GEO_RESTRICTION.md](./architecture/GEO_RESTRICTION.md) | Full documentation |
| **Svelte 5 Migration** | [SVELTE5_MIGRATION.md](./architecture/SVELTE5_MIGRATION.md) | Migration guide |
| **Database Schema** | [schema-optimization.md](./schema-optimization.md) | Schema design decisions |
| **Logging System** | [logging-system.md](./logging-system.md) | App-wide logging |

---

### 📖 Development Guides

| Guide | Documentation | Purpose |
|-------|--------------|---------|
| **Codebase Organization** | [codebase-organization.md](./guides/codebase-organization.md) | Code structure principles |
| **Database Migrations** | [DATABASE_MIGRATION_GUIDE.md](./guides/DATABASE_MIGRATION_GUIDE.md) | How to create and apply migrations |
| **Testing** | [testing.md](./guides/testing.md) | Testing strategy and examples |
| **Optimization** | [optimization.md](./guides/optimization.md) | Build optimization guide |
| **Error Fixes** | [error-fixes-complete.md](./guides/error-fixes-complete.md) | Common issues and solutions |

---

### 📡 API Documentation

| Topic | Documentation | Description |
|-------|--------------|-------------|
| **API Response Types** | [API_RESPONSE_TYPES.md](./api/API_RESPONSE_TYPES.md) | Standardized response formats |
| **Type Safety** | [API_TYPE_SAFETY_SUMMARY.md](./api/API_TYPE_SAFETY_SUMMARY.md) | TypeScript patterns |
| **Dashboard Routing** | [DASHBOARD_ROUTING.md](./api/DASHBOARD_ROUTING.md) | Route structure |

---

### ⚙️ Setup & Configuration

| Task | Documentation | Description |
|------|--------------|-------------|
| **Database Setup** | [database-setup.md](./setup/database-setup.md) | PostgreSQL configuration |
| **Admin Initialization** | [admin-initialization.md](./setup/admin-initialization.md) | Admin user creation |

---

## 🔧 Technology Stack

### Frontend
- **Framework:** SvelteKit 2.0 (file-based routing)
- **UI Library:** Svelte 5 (runes-based reactivity)
- **Styling:** Tailwind CSS
- **Type Safety:** TypeScript (strict mode)
- **Validation:** Zod schemas
- **State Management:** Svelte stores

### Backend
- **Runtime:** Node.js v24+
- **Framework:** SvelteKit (SSR + API routes)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM (type-safe queries)
- **Authentication:** Argon2 (password hashing)
- **Sessions:** JWT + database sessions

### Infrastructure
- **Container:** Podman (rootless)
- **Reverse Proxy:** Nginx
- **Deployment:** Ansible playbooks
- **Email:** Resend API + Celery worker
- **CAPTCHA:** Cloudflare Turnstile
- **Registry:** GitLab Container Registry

---

## 📁 Project Structure

```
em-panel/
├── src/
│   ├── lib/                      # Shared library code
│   │   ├── components/           # Reusable Svelte components
│   │   ├── db/                   # Database schemas & repositories
│   │   │   ├── schema/           # Drizzle ORM schemas
│   │   │   └── repositories/     # Data access layer
│   │   ├── server/               # Server-side utilities
│   │   │   ├── auth/             # Auth guards & session mgmt
│   │   │   ├── database.ts       # Transaction & caching utilities
│   │   │   ├── error-handler.ts  # Centralized error handling
│   │   │   ├── rate-limit.ts     # Rate limiting middleware
│   │   │   └── security.ts       # CSRF, headers, sanitization
│   │   ├── stores/               # Client state management
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   └── validation/           # Zod validation schemas
│   │       └── api-schemas.ts    # 20+ API validation schemas
│   ├── routes/                   # SvelteKit routes
│   │   ├── (admin)/              # Admin-only pages
│   │   ├── (panelist)/           # Panelist dashboard
│   │   ├── (public)/             # Public pages
│   │   └── api/                  # API endpoints
│   └── hooks.server.ts           # Global request handler
├── drizzle/                      # Database migrations
│   ├── 0000_***.sql              # Initial schema
│   ├── 0001-0003_***.sql         # Table creations
│   └── 0004_***.sql              # Performance indexes (46)
├── docs/                         # This documentation
├── scripts/                      # Utility scripts
└── static/                       # Static assets
```

**Key Directories:**
- `src/lib/server/` - Server-only code (auth, security, database)
- `src/lib/validation/` - Input validation schemas
- `src/lib/db/schema/` - Database table definitions
- `src/routes/api/` - API endpoints
- `docs/` - Complete documentation

---

## 🛡️ Security Features

### Implemented (Priority 2-6)

✅ **Input Validation**
- Zod schemas for 20+ endpoints
- XSS prevention (HTML sanitization)
- Email format validation
- Password strength requirements
- UUID/OTP format validation
- Payload size limits (10MB default)

✅ **Rate Limiting**
- Per-IP request throttling
- 5 configurable presets
- Exponential backoff for auth
- Automatic cleanup
- HTTP 429 responses

✅ **Database Optimizations**
- 46 performance indexes
- Transaction management with retry
- Query caching (in-memory)
- Performance monitoring
- Slow query logging

✅ **Security Middleware**
- CSRF protection (token-based)
- Security headers (CSP, X-Frame, etc.)
- Input sanitization
- Attack pattern detection
- Request signing/verification

✅ **Error Handling**
- Correlation ID tracking
- 20+ standardized error codes
- User-safe error messages
- Structured logging
- Retry logic for transient errors

**Integration Status:** Infrastructure complete, API route integration pending

---

## 📊 User Types & Permissions

### User Types
- **Admin**: Full system access, analytics dashboard, user management
- **Panelist**: Survey participation, rewards redemption
- **Client**: Survey creation (planned)
- **Moderator**: Survey management (planned)
- **Guest**: Anonymous sessions, limited access

### Route Protection
- Routes in `(admin)/` → `requireAdmin()` guard
- Routes in `(panelist)/` → `requireAuth()` guard  
- API endpoints → `requireAuth()` or `requireAdmin()`
- Public routes → No authentication required

---

## 🚀 Development Workflow

### Install Dependencies
```bash
cd em-panel
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL
# - ADMIN_EMAIL / ADMIN_PASSWORD
# - TURNSTILE_SITE_KEY / SECRET_KEY
# - RESEND_API_KEY
# - SESSION_SECRET
```

### Run Migrations
```bash
npm run db:migrate
```

### Start Development
```bash
npm run dev
```

### Run Tests
```bash
npm run test
npm run test:unit
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run check
```

---

## 📦 Deployment

### Build Container
```bash
docker build -t registry.gitlab.com/earnmaze/em-panel:latest .
docker push registry.gitlab.com/earnmaze/em-panel:latest
```

### Deploy with Ansible
```bash
cd ../em-deploy
ansible-playbook -i inventory.ini 05_em_panel.yaml --ask-become
```

**Ansible Playbook Includes:**
1. Pull latest container image
2. Mark existing migrations (0001-0003)
3. Apply new migrations (0004+ with indexes)
4. Restart container service
5. Verify health

**See:** [Deployment Guide](../../em-deploy/README.md) for complete instructions

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing

**Guest Session Flow:**
1. Navigate to `/guest`
2. Click "Continue as Guest"
3. Browse surveys
4. Click "Upgrade to Full Account"
5. Complete 3-step verification

**Admin Dashboard:**
1. Login as admin
2. Access `/analytics`
3. View conversion metrics
4. Manage users

---

## 📝 Contributing

### Code Organization Principles

1. **Server-only code** → `lib/server/` (suffixed `.server.ts`)
2. **Client utilities** → `lib/utils/`
3. **Shared types** → `lib/types/`
4. **Validation schemas** → `lib/validation/`
5. **Database logic** → `lib/db/repositories/`

### File Naming Conventions

- **Components:** PascalCase (`UserProfile.svelte`)
- **Routes:** kebab-case (`user-profile/+page.svelte`)
- **Utils:** camelCase (`formatDate.ts`)
- **Types:** PascalCase (`UserType.ts`)
- **Schemas:** kebab-case (`auth-schema.ts`)

### Import Aliases

```typescript
$lib          → src/lib
$server       → src/lib/server
$db           → src/lib/db
$analytics    → src/lib/analytics
$stores       → src/lib/stores
$types        → src/lib/types
$utils        → src/lib/utils
$validation   → src/lib/validation
```

---

## 📚 Additional Resources

### External Documentation
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Tutorial](https://svelte.dev/tutorial/svelte)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Manual](https://www.postgresql.org/docs/16/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Related Projects
- **em-worker** - Celery worker for email sending
- **em-deploy** - Ansible deployment playbooks
- **react-email-starter** - Email templates

---

## 🗂️ Archive

Historical documentation moved to [archive/](./archive/):
- Old completion reports
- Refactoring phase documentation
- Deprecated implementation guides
- Migration completion notes

---

## 📞 Support

### Documentation Issues
- Check this README for navigation
- Search relevant feature docs in `features/`
- Review guides in `guides/`
- Check archived docs if looking for historical info

### Code Issues
- Review [error-fixes-complete.md](./guides/error-fixes-complete.md)
- Check TypeScript compilation: `npm run check`
- Review error logs with correlation IDs
- Search codebase: `grep -r "search-term" src/`

### Deployment Issues
- Check [Deployment Guide](../../em-deploy/README.md)
- Review Ansible playbook logs
- Verify container logs: `podman logs em-panel-container`
- Check database migrations: `npm run db:migrate -- status`

---

**Last Updated:** February 1, 2026  
**Maintained By:** EarnMaze Development Team  
**License:** Proprietary
- **Authentication**: Argon2 password hashing, session-based
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript 5.0

## 📝 Development Guidelines

See [Codebase Organization](./guides/codebase-organization.md) for:
- Code structure best practices
- Import patterns and barrel exports
- Server/client code separation
- Refactoring recommendations

## 🔗 Additional Resources

- [Main README](../README.md) - Project overview
- [Package.json](../package.json) - Dependencies and scripts
- [Drizzle Config](../drizzle.config.ts) - Database configuration
