# Testing Setup

## Overview

The project has been configured with Vitest as the testing framework for comprehensive test coverage of utilities, components, and API routes.

## Setup

### Dependencies Added

The following testing dependencies have been added to `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/svelte": "^4.0.3",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "vitest": "^1.0.4"
  }
}
```

### Configuration Files

- `vitest.config.ts` - Vitest configuration with SvelteKit integration
- `src/test/setup.ts` - Test environment setup with Jest DOM matchers
- `src/lib/validation/respondent-validation.test.ts` - Example test file

### Scripts Added

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Utility Tests

- Validation functions (`sanitizeEmail`, `sanitizeName`, `sanitizePhone`)
- Data masking functions (`maskSensitiveData`)
- Logger functionality
- Performance monitoring

### Component Tests

- Svelte component rendering
- User interactions
- Props validation
- Event handling

### API Route Tests

- Request/response validation
- Authentication middleware
- Error handling
- Database operations

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeEmail } from '$lib/validation/respondent-validation';

describe('sanitizeEmail', () => {
  it('should sanitize email addresses', () => {
    expect(sanitizeEmail('Test.User+Tag@Example.Com')).toBe('test.user+tag@example.com');
  });
});
```

## Coverage Goals

- **Utilities**: 90%+ coverage for validation, logging, and data processing functions
- **Components**: 80%+ coverage for component logic and user interactions
- **API Routes**: 85%+ coverage for request handling and response formatting

## Next Steps

1. Install dependencies: `npm install`
2. Run initial test suite: `npm run test:run`
3. Add more comprehensive tests for components and API routes
4. Set up CI/CD pipeline with test automation
5. Configure coverage reporting and thresholds