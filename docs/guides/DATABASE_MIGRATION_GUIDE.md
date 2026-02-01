# Database Migration Strategy

## Drizzle ORM Commands Overview

### 1. **`npm run db:generate`** (Development Only)
- **Purpose**: Creates migration files from schema changes
- **Output**: Generates `.sql` files in `./drizzle` directory
- **When to use**: After making schema changes locally
- **Not reversible**: Migration files are history records

```bash
npm run db:generate
# Creates: ./drizzle/0001_<timestamp>_<description>.sql
```

### 2. **`npm run db:push`** (Development Only ⚠️)
- **Purpose**: Applies schema directly without migrations
- **How**: Compares current schema with database and syncs
- **When to use**: Local development only
- **⚠️ WARNING**: 
  - No migration history recorded
  - No rollback capability
  - Data loss risk without backups
  - DO NOT USE IN PRODUCTION

```bash
npm run db:push
# Direct sync: schema → database
# No migration files created
```

### 3. **`npm run db:migrate`** (Production ✅)
- **Purpose**: Applies generated migration files in sequence
- **How**: Reads `.sql` files and executes in order
- **When to use**: Staging and Production environments
- **✅ SAFE**:
  - Maintains migration history
  - Can rollback if needed
  - Auditable changelog
  - Idempotent operations

```bash
npm run db:migrate
# Applies: ./drizzle/0001_*.sql, ./drizzle/0002_*.sql, etc.
```

---

## Recommended Workflow

### Local Development
```bash
# 1. Modify schema in src/lib/db/schema/
# 2. Generate migration file
npm run db:generate

# 3. Review generated SQL in ./drizzle/
# 4. Apply to local database
npm run db:push  # or db:migrate (both work locally)
```

### Staging/Production Deployment
```bash
# 1. Check migrations are generated and committed
git log --oneline drizzle/

# 2. Apply migrations in order
npm run db:migrate

# 3. Verify schema
npm run db:generate --verify  # Confirms no pending changes
```

---

## Migration Flow Diagram

```
┌─────────────────────────────────┐
│  1. Schema Change               │
│  (src/lib/db/schema/*.ts)       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  2. Generate Migration          │
│  npm run db:generate            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. Review SQL                  │
│  (./drizzle/0001_*.sql)         │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ DEV            ▼ PROD
┌─────────────┐  ┌──────────────┐
│ db:push     │  │ db:migrate   │
│ (direct)    │  │ (files)      │
└─────────────┘  └──────────────┘
```

---

## Key Differences Table

| Aspect | `db:push` | `db:migrate` |
|--------|-----------|--------------|
| **Files Created** | None | SQL migration files |
| **History** | No record | Full audit trail |
| **Rollback** | Not possible | Possible (if reversible) |
| **Safe for Prod** | ❌ NO | ✅ YES |
| **Idempotent** | ⚠️ Risky | ✅ Safe |
| **Best For** | Local dev only | Staging & Production |
| **Data Safety** | Low | High |

---

## Current Project Status

### Generated Migrations
```
./drizzle/
├── 0001_initial_schema.sql
├── 0002_add_surveys.sql
├── 0003_add_guest_sessions.sql
├── ...
└── meta/
    └── _journal.json  # Migration history
```

### For Deployment
1. **Always use** `npm run db:migrate` in production
2. **Commit** migration files to git
3. **Track** schema changes in migrations
4. **Review** SQL before deployment
5. **Backup** database before migrations

---

## Emergency Procedures

### If wrong schema synced with `db:push`:
```bash
# 1. Restore database from backup
# 2. Generate correct migrations
npm run db:generate

# 3. Apply migrations
npm run db:migrate

# 4. Verify
npm run db:generate --verify
```

### Check current migration status:
```bash
# See what's been applied
npm run db:migrate --dry

# Verify no pending schema changes
npm run db:generate --verify
```
