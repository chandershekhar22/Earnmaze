# QS-Panel Documentation

Complete documentation for the QS-Panel survey management system.

## 📚 Documentation Structure

### 🚀 Setup & Installation
- [Database Setup](./setup/database-setup.md) - PostgreSQL configuration and connection
- [Admin Initialization](./setup/admin-initialization.md) - Auto-creating admin users on startup

### ✨ Features
- [Authentication](./features/authentication.md) - Admin authentication and authorization system
- [Analytics](./features/analytics.md) - Conversion tracking and traffic source analysis
- [User Tracking](./features/user-tracking.md) - Unique user identification with fingerprinting

### 📖 Guides
- [Testing](./guides/testing.md) - Testing strategy and examples
- [Optimization](./guides/optimization.md) - Build optimization and performance
- [Codebase Organization](./guides/codebase-organization.md) - Code structure and refactoring plan

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/        # Reusable UI components
│   ├── db/               # Database schema and utilities
│   ├── server/           # Server-side auth guards
│   ├── stores/           # Client-side state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Client-safe utilities
│   └── validation/       # Zod validation schemas
├── routes/
│   ├── (admin)/         # Admin-only pages
│   ├── (panelist)/      # Panelist dashboard
│   ├── (public)/        # Public pages
│   └── api/             # API endpoints
└── hooks.server.ts      # Global request handler
```

## 🔐 Authentication System

### User Types
- **Admin**: Full system access, analytics dashboard
- **Panelist**: Survey participation
- **Client**: Survey creation (planned)
- **Moderator**: Survey management (planned)

### Protected Routes
- Routes in `(admin)/` require admin authentication
- Routes in `(panelist)/` require panelist authentication
- API endpoints use `requireAuth()` and `requireAdmin()` guards

## 📊 Analytics Features

### Tracking Capabilities
- Page visit tracking with UTM parameters
- Email conversion tracking with time-to-convert
- CTA click tracking
- Unique user identification via browser fingerprinting
- Traffic source detection (direct, referral, search, social)

### Admin Dashboard
View real-time metrics at `/analytics` (admin only):
- Total visits, conversions, CTA clicks
- Conversion rate and average time-to-convert
- Traffic source breakdown
- Recent conversions table

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and admin user
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Admin auto-initialization**
   - Admin user is automatically created on first startup
   - Credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`

## 🛠️ Tech Stack

- **Framework**: SvelteKit 2.0
- **Database**: PostgreSQL 16 with Drizzle ORM
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
