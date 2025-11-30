# QS-Panel Project Structure

## 📁 Directory Organization

```
qs-panel/
├── src/                          # Source code
│   ├── lib/                      # Shared library code
│   │   ├── components/           # Reusable Svelte components
│   │   │   ├── layout/           # Layout components (Header, Sidebar, etc.)
│   │   │   └── examples/         # Example/demo components
│   │   ├── db/                   # Database layer
│   │   │   ├── schema/           # Drizzle ORM schemas
│   │   │   └── repositories/     # Data access layer
│   │   ├── server/               # Server-side logic
│   │   │   └── auth/             # Authentication logic
│   │   ├── stores/               # Svelte stores (state management)
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Utility functions
│   │   ├── validation/           # Input validation schemas
│   │   ├── analytics/            # Analytics tracking
│   │   └── email-templates/      # Email templates
│   ├── routes/                   # SvelteKit routes (pages & API)
│   ├── test/                     # Test utilities
│   ├── app.html                  # HTML template
│   ├── app.pcss                  # Global styles (PostCSS)
│   ├── app.d.ts                  # Global TypeScript types
│   └── hooks.server.ts           # SvelteKit server hooks
├── static/                       # Static assets
├── build/                        # Production build output
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   │   ├── API_RESPONSE_TYPES.md
│   │   ├── API_TYPE_SAFETY_SUMMARY.md
│   │   └── DASHBOARD_ROUTING.md
│   ├── architecture/             # Architecture docs
│   │   ├── GEO_RESTRICTION*.md
│   │   ├── TURNSTILE*.md
│   │   └── SVELTE5_MIGRATION*.md
│   ├── features/                 # Feature documentation
│   ├── guides/                   # User guides
│   └── setup/                    # Setup instructions
├── scripts/                      # Utility scripts
│   ├── seed-auth.ts              # Seed auth data
│   └── init-admin.ts             # Initialize admin user
├── drizzle/                      # Database migrations
│   └── meta/                     # Migration metadata
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
├── svelte.config.js              # SvelteKit config
├── tailwind.config.js            # Tailwind CSS config
├── drizzle.config.ts             # Drizzle ORM config
└── Dockerfile                    # Container image
```

## 🗂️ Code Organization Principles

### `/src/lib` - Shared Code

**Purpose:** Reusable code accessible via `$lib` alias

**Structure:**
- `components/` - UI components
- `db/` - Database schemas and repositories
- `server/` - Server-side business logic
- `stores/` - Client-side state management
- `types/` - Shared TypeScript types
- `utils/` - Helper functions
- `validation/` - Zod schemas

### `/src/routes` - Pages & API

**Purpose:** File-based routing (SvelteKit convention)

**Structure:**
- `+page.svelte` - Page components
- `+page.server.ts` - Server-side page logic
- `+server.ts` - API endpoints
- `+layout.svelte` - Layout components
- `+error.svelte` - Error pages

### `/docs` - Documentation

**Purpose:** Technical documentation

**Categories:**
- `api/` - API contracts and routing
- `architecture/` - Design decisions
- `features/` - Feature specifications
- `guides/` - How-to guides
- `setup/` - Installation instructions

## 🏗️ Architecture

**Frontend:** SvelteKit 2 (Svelte 5)
**Database:** PostgreSQL + Drizzle ORM
**Authentication:** Argon2 password hashing
**Styling:** Tailwind CSS
**Testing:** Vitest + Testing Library
**Deployment:** Docker + Node.js adapter

## 📦 Key Dependencies

**Core:**
- `@sveltejs/kit` - Framework
- `svelte` - UI library
- `drizzle-orm` - Database ORM
- `argon2` - Password hashing

**Development:**
- `typescript` - Type safety
- `vitest` - Testing
- `prettier` - Code formatting
- `eslint` - Linting

## 🚀 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run admin:init   # Initialize admin user
```

## 📝 File Naming Conventions

- Components: `PascalCase.svelte`
- Utilities: `camelCase.ts`
- Types: `PascalCase.ts`
- Routes: SvelteKit convention (`+page.svelte`, etc.)
- Tests: `*.test.ts`
- Configs: `kebab-case.config.ts`

## 🔐 Environment Variables

See `.env.example` for required environment variables:
- Database connection
- Authentication secrets
- API keys
- Feature flags

## 📚 Additional Documentation

- [README.md](../README.md) - Getting started
- [API Documentation](api/) - API contracts
- [Architecture Decisions](architecture/) - Design docs
