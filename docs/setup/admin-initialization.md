# Auto-Initialize Admin User

## Overview

The application automatically creates an admin user on startup if:
1. Admin credentials are defined in environment variables
2. No user with that email exists yet

This ensures there's always an admin account available without manual database seeding.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Admin User (Auto-created on startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_NAME=System Administrator
```

### Example .env Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

## How It Works

### Automatic Initialization

The admin user is created automatically when:

1. **Development Mode** - On `npm run dev`
2. **Production Mode** - On `npm start`
3. **Server Startup** - Runs in `hooks.server.ts`

### Initialization Logic

```typescript
// On server startup:
1. Check if ADMIN_EMAIL and ADMIN_PASSWORD are set
2. Check if user with ADMIN_EMAIL exists
3. If not exists → Create admin user
4. If exists but not admin → Upgrade to admin role
5. If exists and is admin → Skip
```

### Behavior

| Scenario | Action |
|----------|--------|
| No env vars set | Skip (logs info message) |
| Email exists, is admin | Skip (logs confirmation) |
| Email exists, not admin | Upgrade to admin role |
| Email doesn't exist | Create new admin user |

## Manual Initialization

You can also manually run the admin initialization:

```bash
npm run admin:init
```

This will:
- Read credentials from `.env`
- Create admin user if needed
- Report success or failure

## Security Best Practices

### Production Setup

1. **Use Strong Passwords**
```bash
ADMIN_PASSWORD=ComplexP@ssw0rd!WithNumbers123
```

2. **Change Default Credentials**
```bash
# Don't use the example credentials in production!
ADMIN_EMAIL=your-actual-admin@yourdomain.com
```

3. **Secure Environment Variables**
```bash
# Use a secrets manager in production
# Don't commit .env to version control
echo ".env" >> .gitignore
```

4. **Rotate Credentials**
- Change admin password after first login
- Use password manager
- Enable 2FA (when implemented)

### Environment-Specific Configs

#### Development
```bash
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=dev123
ADMIN_NAME=Dev Admin
```

#### Staging
```bash
ADMIN_EMAIL=admin@staging.example.com
ADMIN_PASSWORD=<secure-password>
ADMIN_NAME=Staging Admin
```

#### Production
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<very-secure-password>
ADMIN_NAME=Production Admin
```

## Troubleshooting

### Admin User Not Created

**Check logs:**
```bash
npm run dev

# Look for:
# 🔐 Checking admin user...
# ✅ Admin user created successfully!
```

**Common issues:**

1. **Missing environment variables**
```
ℹ️  No admin credentials in environment variables
```
**Solution:** Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `.env`

2. **Database connection error**
```
❌ Admin initialization failed: Connection refused
```
**Solution:** Check `DATABASE_URL` in `.env`

3. **Invalid email format**
```
❌ Admin initialization failed: Invalid email
```
**Solution:** Use valid email format (e.g., `admin@example.com`)

### Admin User Exists But Can't Login

**Possible causes:**

1. **Wrong password**
   - Check `ADMIN_PASSWORD` in `.env`
   - Password is case-sensitive

2. **User is not admin role**
   - Script will automatically upgrade role
   - Check logs for "Updating role..." message

3. **Account inactive**
   ```sql
   -- Check user status
   SELECT email, "userType", "isActive", "isDeleted" 
   FROM users 
   WHERE email = 'admin@example.com';
   ```

### Verify Admin User

**Check if admin exists:**

```sql
-- In your database
SELECT id, email, name, "userType", "isActive"
FROM users
WHERE "userType" = 'admin';
```

**Or use the initialization script:**

```bash
npm run admin:init

# Output will show:
# ✅ Admin user already exists: admin@example.com
```

## Advanced Usage

### Multiple Admin Users

Create additional admins by:

1. **Via Script** - Modify and run multiple times with different env vars
2. **Via Database** - Direct SQL insert
3. **Via Admin Panel** - Once first admin logs in, create more

### Custom Admin Creation

Create a custom script:

```typescript
// scripts/create-custom-admin.ts
import { createUser } from '../src/lib/db/auth-utils';

await createUser({
  email: 'custom@example.com',
  password: 'CustomPassword123',
  name: 'Custom Admin',
  userType: 'admin'
});
```

### Disable Auto-Initialization

Remove or comment out from `hooks.server.ts`:

```typescript
// Comment out to disable:
// initializeAdminOnStartup();
```

## Integration with CI/CD

### Docker Example

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app
COPY . .

# Install dependencies
RUN npm ci

# Build application
RUN npm run build

# Set default admin (override with env vars)
ENV ADMIN_EMAIL=admin@example.com
ENV ADMIN_PASSWORD=change_me

# Start application (admin auto-created)
CMD ["npm", "start"]
```

### Kubernetes Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: admin-credentials
type: Opaque
stringData:
  ADMIN_EMAIL: admin@example.com
  ADMIN_PASSWORD: secure-password-here
  ADMIN_NAME: K8s Admin
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_NAME=${ADMIN_NAME}
    env_file:
      - .env
```

## Logging

### Success Logs

```
🔐 Checking admin user...
📝 Creating admin user...
✅ Admin user created successfully!
   Email: admin@example.com
   Name: Admin User
🔒 You can now login with these credentials
```

### Info Logs

```
🔐 Checking admin user...
✅ Admin user already exists: admin@example.com
```

### Warning Logs

```
🔐 Checking admin user...
⚠️  Warning: User exists but is not an admin. Updating role...
✅ User role updated to admin
```

### Error Logs

```
❌ Admin initialization failed: [error details]
⚠️  Application will continue, but admin user was not created
```

## Best Practices

1. ✅ **Always use environment variables** - Never hardcode credentials
2. ✅ **Use .env.example** - Document required variables
3. ✅ **Ignore .env in git** - Add to `.gitignore`
4. ✅ **Use strong passwords** - Minimum 12 characters
5. ✅ **Change defaults** - Don't use example credentials
6. ✅ **Monitor logs** - Check admin creation on deployment
7. ✅ **Test locally** - Verify before deploying

## Files Modified

- `scripts/init-admin.ts` - Admin initialization script
- `src/hooks.server.ts` - Auto-run on server startup
- `.env.example` - Example environment variables
- `package.json` - Added `admin:init` script

## Related Documentation

- [ADMIN_AUTH.md](./ADMIN_AUTH.md) - Admin authentication system
- [README.md](./README.md) - General application setup
