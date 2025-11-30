# API Versioning Structure

## Overview

The API is versioned using URL path versioning (`/api/v1/`, `/api/v2/`, etc.) to allow for backward-compatible evolution of the API.

## Current Version

**v1** - Current stable API version

## Structure

```
routes/api/
├── v1/                    ← Version 1 API (current)
│   ├── auth/             ← Authentication endpoints
│   ├── analytics/        ← Analytics endpoints (admin only)
│   ├── panelist/         ← Panelist endpoints
│   └── surveys/          ← Survey endpoints
├── auth/                 ← Legacy auth endpoints (kept for backward compatibility)
├── panelist/             ← Legacy panelist endpoints
├── surveys/              ← Legacy surveys endpoints
└── analytics/            ← Legacy analytics endpoints
```

## Migration Strategy

### Phase 1: Create v1 Structure (Current)
- Set up `/api/v1/` folder structure
- Keep existing endpoints at root level for backward compatibility
- New features go into `/api/v1/`

### Phase 2: Migrate Existing Endpoints
- Copy existing endpoints to `/api/v1/`
- Update imports and dependencies
- Add deprecation warnings to old endpoints

### Phase 3: Deprecate Old Endpoints
- Add `X-API-Version` header to responses
- Return deprecation warnings in old endpoint responses
- Document migration path for clients

### Phase 4: Remove Old Endpoints (Future)
- After sufficient migration period
- Remove old endpoints from root `/api/`
- Only `/api/v1/` and newer versions remain

## Usage

### Current (Legacy)
```typescript
// Still works but will be deprecated
fetch('/api/auth/login', { ... })
fetch('/api/panelist/points', { ... })
```

### Recommended (v1)
```typescript
// New versioned endpoints
fetch('/api/v1/auth/login', { ... })
fetch('/api/v1/panelist/points', { ... })
```

## Response Headers

All v1 endpoints include:
```
X-API-Version: 1
```

Legacy endpoints include deprecation warning:
```
X-API-Deprecated: true
X-API-Deprecation-Message: This endpoint is deprecated. Use /api/v1/ endpoints instead.
```

## Best Practices

1. **Always version new endpoints** - Put new features in `/api/v1/`
2. **Don't break existing APIs** - If you need breaking changes, create v2
3. **Document changes** - Update CHANGELOG for each version
4. **Set deprecation timelines** - Give clients time to migrate (minimum 6 months)
5. **Use semantic versioning principles** - Major version for breaking changes

## Future Versions

When creating v2:
1. Create `/api/v2/` directory
2. Copy v1 endpoints as base
3. Make breaking changes only in v2
4. Keep v1 stable and supported
5. Document all differences in migration guide

## Testing

Test both versions:
```bash
# Test v1
curl http://localhost:3000/api/v1/auth/login

# Test legacy (should still work)
curl http://localhost:3000/api/auth/login
```
