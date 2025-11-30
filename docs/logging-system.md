# App-Wide Logging System

A comprehensive, production-ready logging system for the EarnMaze Panel application.

## 🚀 Features

- **Multi-Level Logging**: DEBUG, INFO, WARN, ERROR with configurable thresholds
- **Contextual Loggers**: Dedicated loggers for different app areas (auth, api, ui, etc.)
- **Performance Monitoring**: Built-in performance tracking and slow operation detection
- **User Session Tracking**: Automatic session management and user action tracking
- **Security Logging**: Authentication attempts and security event monitoring
- **Error Handling**: Global error catching with detailed context
- **Production Ready**: Automatic log collection for external services
- **Type Safe**: Full TypeScript support with proper interfaces

## 📁 File Structure

```
src/lib/utils/
├── logger.ts              # Core logger implementation
├── app-logger.ts         # App-wide logging configuration
└── examples/
    └── component-logger-example.md
```

## 🔧 Quick Start

### 1. Basic Usage

```typescript
import { Logger } from '$lib/utils/app-logger';

// Use contextual loggers
Logger.auth.info('User logged in', { userId: '123' });
Logger.api.error('API call failed', { endpoint: '/users', status: 500 });
Logger.ui.debug('Component rendered', { component: 'UserProfile' });
```

### 2. Performance Monitoring

```typescript
import { Perf } from '$lib/utils/app-logger';

// Method 1: Manual timing
const operationId = Perf.start('data-processing');
// ... do work ...
Perf.end(operationId, { recordsProcessed: 100 });

// Method 2: Automatic timing
const result = await Perf.measure('api-call', async () => {
  return fetch('/api/data');
}, { endpoint: '/api/data' });
```

### 3. Feature Tracking

```typescript
import { Features } from '$lib/utils/app-logger';

// Track page views
Features.trackPageView('/dashboard');

// Track user actions
Features.trackUserAction('button-click', 'survey-list', { 
  surveyId: '123' 
});

// Track feature usage
Features.track('surveys', 'create', { category: 'consumer' });
```

### 4. Security Logging

```typescript
import { Security } from '$lib/utils/app-logger';

// Log authentication events
Security.logAuthAttempt('login', 'user@example.com', true);

// Log security events
Security.logSecurityEvent('suspicious-activity', 'high', {
  reason: 'multiple-failed-logins',
  ip: '192.168.1.100'
});
```

## 📊 Available Loggers

### Core Loggers

- `Logger.auth` - Authentication & authorization
- `Logger.api` - API calls & responses
- `Logger.database` - Database operations
- `Logger.ui` - UI components & interactions
- `Logger.performance` - Performance metrics
- `Logger.security` - Security events
- `Logger.errors` - Error handling
- `Logger.app` - General application events

### Business Logic Loggers

- `Logger.surveys` - Survey operations
- `Logger.respondents` - User management
- `Logger.analytics` - Analytics & reporting
- `Logger.rewards` - Reward system

## 🎯 Usage Examples

### Component Logging

```svelte
<script lang="ts">
  import { Logger, Features, Perf } from '$lib/utils/app-logger';
  
  const componentLogger = Logger.components;
  
  onMount(() => {
    componentLogger.info('Component mounted');
    Features.track('dashboard', 'view');
  });
  
  async function handleAction() {
    const operationId = Perf.start('user-action');
    
    try {
      await performAction();
      Perf.end(operationId, { success: true });
      Features.trackUserAction('action-completed', 'dashboard');
    } catch (error) {
      Perf.end(operationId, { success: false, error: error.message });
      componentLogger.error('Action failed', { error: error.message });
    }
  }
</script>
```

### API Logging

```typescript
// In your API routes
import { Logger, API } from '$lib/utils/app-logger';

export async function POST({ request }) {
  const requestId = API.logRequest('POST', '/api/surveys', await request.json());
  const startTime = performance.now();
  
  try {
    // ... process request ...
    const duration = performance.now() - startTime;
    API.logResponse(requestId, 200, duration, result);
    return json(result);
  } catch (error) {
    const duration = performance.now() - startTime;
    API.logError(requestId, error, duration);
    return json({ error: error.message }, { status: 500 });
  }
}
```

### Store Logging

```typescript
// In your Svelte stores
import { Logger, Security } from '$lib/utils/app-logger';

function createUserStore() {
  const { subscribe, set, update } = writable([]);
  
  return {
    subscribe,
    async loadUsers() {
      Logger.database.info('Loading users');
      try {
        const users = await fetchUsers();
        set(users);
        Logger.database.info('Users loaded successfully', { count: users.length });
      } catch (error) {
        Logger.database.error('Failed to load users', { error: error.message });
        throw error;
      }
    }
  };
}
```

## ⚙️ Configuration

### Log Levels

```typescript
// In app-logger.ts
export const LOG_CONFIG = {
  development: {
    console: LogLevel.DEBUG,  // Show all logs in dev
    api: LogLevel.ERROR,      // Only send errors to API
  },
  production: {
    console: LogLevel.ERROR,  // Only show errors in console
    api: LogLevel.WARN,       // Send warnings and errors to API
  }
};
```

### Environment Variables

```bash
# .env
NODE_ENV=development
VITE_LOG_LEVEL=DEBUG
VITE_ENABLE_PERFORMANCE_LOGGING=true
VITE_ENABLE_USER_TRACKING=true
```

## 🏭 Production Setup

### External Logging Services

The system is ready for integration with external logging services:

```typescript
// In logger.ts - sendToLoggingService method
async function sendToLoggingService(logEntry: LogEntry) {
  // Sentry
  Sentry.addBreadcrumb({
    message: logEntry.message,
    level: logEntry.level,
    data: logEntry.data
  });
  
  // DataDog
  await fetch('https://http-intake.logs.datadoghq.com/v1/input/YOUR_API_KEY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry)
  });
  
  // Custom analytics
  await fetch('/api/analytics/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry)
  });
}
```

### Log Collection API

Use the built-in `/api/logs` endpoint:

```bash
curl -X POST http://localhost:5173/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": 2,
    "message": "User action completed",
    "context": "UI",
    "data": { "action": "survey-submit" },
    "timestamp": "2025-08-10T10:30:00.000Z",
    "userId": "user-123"
  }'
```

## 📈 Monitoring & Analytics

### Performance Metrics

The system automatically tracks:
- API response times
- Component render times
- Database query duration
- User action latency
- Page load times

### User Behavior

Automatic tracking of:
- Page views and navigation
- Feature usage patterns
- User action sequences
- Session duration
- Error frequencies

### Security Events

Monitoring of:
- Authentication attempts
- Failed login patterns
- Suspicious activities
- Security policy violations

## 🛠️ Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
Logger.auth.debug('Starting login process');
Logger.auth.info('Login successful');
Logger.auth.warn('Login rate limit approaching');
Logger.auth.error('Login failed due to network error');

// ❌ Avoid
Logger.auth.error('User clicked login button'); // Too verbose for error
Logger.auth.debug('Critical security breach');  // Too quiet for critical
```

### 2. Include Relevant Context

```typescript
// ✅ Good
Logger.api.error('Payment processing failed', {
  userId: '123',
  amount: 50.00,
  paymentMethod: 'card',
  errorCode: 'CARD_DECLINED',
  transactionId: 'txn_456'
});

// ❌ Avoid
Logger.api.error('Payment failed'); // Not enough context
```

### 3. Use Performance Monitoring

```typescript
// ✅ Good - Use for significant operations
const operationId = Perf.start('data-export');
await generateReport();
Perf.end(operationId, { recordCount: 1000 });

// ❌ Avoid - Don't overuse for trivial operations
const id = Perf.start('variable-assignment');
const x = 1;
Perf.end(id);
```

### 4. Protect Sensitive Data

```typescript
// ✅ Good
Logger.auth.info('User registered', {
  userId: user.id,
  email: maskEmail(user.email), // user@example.com -> us***@example.com
  role: user.role
});

// ❌ Avoid
Logger.auth.info('User registered', {
  password: user.password,     // Never log passwords
  ssn: user.socialSecurity    // Never log PII
});
```

## 🔍 Debugging

### View Logs in Development

```bash
# Browser console will show all logs
# Use filter: [Auth], [API], [UI], etc.

# Example output:
[2025-08-10T10:30:00.000Z] INFO [Auth]: Login successful | Data: {"userId":"123","role":"user"}
```

### Production Log Analysis

```sql
-- Example queries for log analysis
SELECT COUNT(*) FROM logs WHERE level = 'ERROR' AND timestamp > NOW() - INTERVAL 1 HOUR;
SELECT context, COUNT(*) FROM logs WHERE level = 'WARN' GROUP BY context;
SELECT AVG(duration) FROM performance_logs WHERE operation = 'api-call';
```

## 🚨 Troubleshooting

### Common Issues

1. **Logs not appearing in production**
   - Check `LOG_CONFIG.production.console` level
   - Verify environment variables
   - Check browser console filters

2. **Performance monitoring not working**
   - Ensure `enablePerformanceLogging` is true
   - Check `Perf.start()` and `Perf.end()` are paired
   - Verify operation names match

3. **API logs missing**
   - Check `/api/logs` endpoint status
   - Verify request format matches `LogEntry` interface
   - Check network connectivity

### Debug Mode

```typescript
// Enable debug mode
Logger.app.info('Debug mode enabled');
console.log('Current log config:', LOG_CONFIG);
console.log('Session ID:', Session.getSessionId());
```

## 📚 Additional Resources

- [Logger API Documentation](./logger.ts)
- [Performance Monitoring Guide](./performance-guide.md)
- [Security Logging Best Practices](./security-guide.md)
- [Production Deployment Guide](./deployment-guide.md)

---

This logging system provides comprehensive observability for your EarnMaze Panel application, helping you monitor performance, track user behavior, debug issues, and maintain security across all environments.
