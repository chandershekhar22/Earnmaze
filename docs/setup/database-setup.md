# Database Connection Fix - Login Error Resolution

## Problem
```
DrizzleQueryError: Cannot read properties of undefined (reading 'query')
```

This error occurred because the database connection wasn't initialized properly. The root cause: **DATABASE_URL pointing to `localhost` inside Docker container**.

## Root Cause

In Docker/Podman containers:
- `localhost` or `127.0.0.1` = the container itself (not the host)
- Service names (e.g., `postgres`, `qspanel-postgres`) = other containers in the network

Your `.env` file had:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/earnmaze
```

This tried to connect to PostgreSQL inside the qs-panel container (which doesn't exist), not the postgres service container.

## Solution Applied

### 1. **Updated .env file** (for local docker-compose development)
```
DATABASE_URL=postgres://postgres:postgres@qspanel-postgres:5432/earnmaze
```

### 2. **Updated Systemd Service Template** (`qs-panel-container.service.j2`)

Added environment variables to the podman run command:
```jinja
ExecStart=/usr/bin/podman run --name qs-panel \
          -p 6000:3000 \
          --network podman \
          -e DATABASE_URL="{{ database_url }}" \
          -e NODE_ENV=production \
          {{ image }}
```

### 3. **Updated Deployment Variables** (`qs_panel_vars.yaml`)

Added the database_url variable:
```yaml
database_url: "postgres://postgres:postgres@postgres:5432/earnmaze"
```

## How It Works

### Local Development (docker-compose)
```yaml
services:
  app: # can reach postgres via service name
    DATABASE_URL=postgres://user:pass@db:5432/dbname
  db:
    service_name: db
```

### Production (Podman + Systemd)
```jinja
podman run \
  -e DATABASE_URL="postgres://user:pass@postgres:5432/dbname" \
  --network podman \  # connects to postgres container
  image
```

## Network Names to Use

| Environment | Host Name | Notes |
|-------------|-----------|-------|
| docker-compose | `qspanel-postgres` | Service name from docker-compose.yml |
| Podman (podman network) | `postgres` | Service name depends on deployment |
| Direct host | `localhost` or IP | For local development on host |

## Testing the Fix

1. **Redeploy with Ansible**
```bash
ansible-playbook deploy_qs_panel.yml
```

2. **Check logs**
```bash
journalctl -u qs-panel -f
# or with podman
podman logs qs-panel
```

3. **Try login**
```bash
curl -X POST http://localhost:6000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Important Notes

⚠️ **Security**: The database URL contains credentials. In production:
- Use environment variables passed securely
- Consider using `.env.production` or secrets management
- Never commit sensitive URLs to git

✅ **Ansible Variables**: The `database_url` is now templated via Ansible vars, making it configurable per environment.

## Files Changed

1. `/home/alpha/Projects/qsurvey/qs-panel/.env`
2. `/home/alpha/Projects/qsurvey/qs-deploy/templates/qs-panel-container.service.j2`
3. `/home/alpha/Projects/qsurvey/qs-deploy/qs_panel_vars.yaml`
