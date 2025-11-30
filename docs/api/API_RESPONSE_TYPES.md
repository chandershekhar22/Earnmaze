# API Response Type Definitions

This document describes the typed API responses implemented across the application. All API endpoints return consistent, type-safe responses that expose only necessary public fields.

## Overview

- **Location**: `/src/lib/types/api-responses.ts`
- **Purpose**: Ensure type safety, prevent data leakage, and maintain consistent API contracts
- **Benefits**: 
  - Type-safe API consumption on frontend
  - Prevention of sensitive data exposure (passwords, internal IDs, etc.)
  - Clear API documentation through TypeScript types
  - Autocomplete support in IDEs

## Base Response Types

### `ApiSuccessResponse<T>`
```typescript
{
  success: true;
  data: T;
  message?: string;
}
```

### `ApiErrorResponse`
```typescript
{
  success: false;
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}
```

## Authentication API Responses

### `POST /api/auth/login`

**Response Type**: `LoginResponse`

**Success Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "panelist",
    "createdAt": "2025-01-01T00:00:00Z",
    "emailVerified": true,
    "image": null
  }
}
```

**Error Responses**:
- `400`: "Email and password are required"
- `401`: "Invalid email or password"
- `401`: "Account is not active"
- `500`: "Internal server error"

**Excluded Fields**: `password`, `session`, `isDeleted`, internal metadata

---

### `POST /api/auth/register`

**Response Type**: `RegisterResponse`

**Success Response**: Same structure as login

**Error Responses**:
- `400`: "Email and password are required"
- `409`: "User with this email already exists"
- `500`: "Failed to create user"
- `500`: "Internal server error"

---

### `GET /api/auth/me`

**Response Type**: `MeResponse`

**Success Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "panelist",
    "createdAt": "2025-01-01T00:00:00Z",
    "emailVerified": true,
    "image": null
  }
}
```

Returns `{ "user": null }` if not authenticated.

---

### `POST /api/auth/logout`

**Response**: `303 Redirect` to `/`

Clears session and redirects to home page.

---

## Panelist API Responses

### `GET /api/panelist/dashboard`

**Response Type**: `PanelistDashboardResponse`

**Success Response**:
```json
{
  "totalPoints": 1250,
  "lifetimeEarnings": 3500,
  "surveysCompleted": 42,
  "averageRating": 4.8,
  "currentTier": "gold",
  "completionRate": 95.5,
  "recentActivity": [
    {
      "id": "uuid",
      "type": "survey_completed",
      "description": "Completed: Market Research Survey",
      "amount": 100,
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "availableSurveys": 8
}
```

**Required**: User must be authenticated and have `userType: "panelist"`

**Error Responses**:
- `401`: "Unauthorized"
- `403`: "Forbidden"
- `500`: "Failed to fetch dashboard data"

---

### `GET /api/panelist/points`

**Response Type**: `PanelistPointsResponse`

**Success Response**:
```json
{
  "currentBalance": 1250,
  "lifetimeEarned": 3500,
  "lifetimeRedeemed": 2250,
  "pendingPoints": 50,
  "tier": "gold",
  "nextTierPoints": 5000
}
```

**Required**: User must be authenticated panelist

**Error Responses**:
- `401`: "Unauthorized"
- `403`: "Forbidden"
- `500`: "Failed to fetch points data"

---

### `GET /api/panelist/transactions`

**Response Type**: `PointsTransactionsResponse`

**Success Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "earned",
      "amount": 100,
      "balanceAfter": 1250,
      "description": "Survey Completion: Market Research",
      "referenceType": "survey",
      "referenceId": "survey-uuid",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "currentBalance": 1250,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Transaction Types**: `earned`, `redeemed`, `bonus`, `penalty`, `adjustment`

---

### `GET /api/panelist/survey-transactions`

**Response Type**: `SurveyTransactionsResponse`

**Success Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "surveyId": "survey-uuid",
      "surveyTitle": "Market Research Survey",
      "status": "completed",
      "pointsEarned": 100,
      "timeSpentMinutes": 12,
      "completedAt": "2025-01-15T10:30:00Z",
      "invitedAt": "2025-01-15T09:00:00Z"
    }
  ],
  "totalCompleted": 42,
  "totalEarned": 3500,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Survey Status**: `invited`, `started`, `completed`, `disqualified`, `expired`

---

## Survey API Responses

### `GET /api/surveys/available`

**Response Type**: `AvailableSurveysResponse`

**Success Response**:
```json
[
  {
    "id": "uuid",
    "title": "Market Research Survey",
    "description": "Share your opinions about consumer products",
    "category": "market_research",
    "pointsReward": 100,
    "estimatedMinutes": 10,
    "targetResponses": 1000,
    "currentResponses": 456,
    "expiresAt": "2025-02-01T23:59:59Z",
    "qualificationCriteria": [
      {
        "field": "age",
        "operator": ">=",
        "value": 18
      }
    ]
  }
]
```

**Required**: User must be authenticated panelist

**Error Responses**:
- `401`: "Unauthorized"
- `403`: "Forbidden"
- `500`: "Failed to fetch surveys"

**Excluded Fields**: Internal survey routing, API keys, admin notes

---

## Rewards API Responses

### `GET /api/rewards`

**Response Type**: `RewardsListResponse`

**Success Response**:
```json
[
  {
    "id": "uuid",
    "title": "$5 Amazon Gift Card",
    "description": "Redeem for a $5 Amazon gift card",
    "pointsCost": 500,
    "originalPrice": 5.00,
    "category": "gift_cards",
    "emoji": "🛒",
    "imageUrl": "/images/rewards/amazon.png",
    "stock": 25,
    "isAvailable": true,
    "deliveryType": "digital",
    "estimatedDelivery": "Within 24 hours"
  }
]
```

**Stock Values**: Number or `"unlimited"`

**Delivery Types**: `digital`, `physical`, `virtual`

---

### `POST /api/rewards/redeem`

**Request Body**:
```json
{
  "rewardId": "uuid",
  "quantity": 1
}
```

**Response Type**: `RewardRedemptionResponse`

**Success Response**:
```json
{
  "redemptionId": "uuid",
  "rewardId": "uuid",
  "pointsSpent": 500,
  "newBalance": 750,
  "status": "pending",
  "estimatedDelivery": "Within 24 hours",
  "message": "Reward redeemed successfully!"
}
```

**Redemption Status**: `pending`, `processing`, `fulfilled`

**Error Responses**:
- `401`: "Unauthorized"
- `400`: "Insufficient points"
- `404`: "Reward not found"
- `400`: "Reward out of stock"
- `500`: "Failed to redeem reward"

---

## Analytics API Responses

### `GET /api/analytics/conversions`

**Response Type**: `ConversionStatsResponse`

**Success Response**:
```json
{
  "totalVisits": 1250,
  "totalConversions": 87,
  "conversionRate": 6.96,
  "uniqueVisitors": 1100,
  "averageTimeToConvert": 3.5,
  "topSources": [
    {
      "source": "google",
      "visits": 450,
      "conversions": 35,
      "rate": 7.78
    }
  ],
  "recentConversions": [
    {
      "email": "user@example.com",
      "source": "facebook",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Public Endpoint**: Used for marketing analytics

---

## Error Response Standards

### Standard Error Codes

```typescript
type ApiErrorCode = 
  | 'UNAUTHORIZED'          // 401: Not authenticated
  | 'FORBIDDEN'             // 403: Insufficient permissions
  | 'NOT_FOUND'             // 404: Resource not found
  | 'BAD_REQUEST'           // 400: Invalid request
  | 'VALIDATION_ERROR'      // 400: Data validation failed
  | 'INTERNAL_ERROR'        // 500: Server error
  | 'RATE_LIMIT_EXCEEDED'   // 429: Too many requests
  | 'INSUFFICIENT_POINTS'   // 400: Not enough points
  | 'RESOURCE_UNAVAILABLE'  // 503: Resource temporarily unavailable
  | 'DUPLICATE_ENTRY'       // 409: Resource already exists
  | 'SESSION_EXPIRED';      // 401: Session expired
```

### Detailed Error Response

```json
{
  "success": false,
  "error": "Insufficient points",
  "code": "INSUFFICIENT_POINTS",
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/rewards/redeem"
}
```

---

## Type Guards

### `isApiError(response)`
Check if an API response is an error:
```typescript
if (isApiError(response)) {
  console.error(response.error);
}
```

### `isApiSuccess(response)`
Check if an API response is successful:
```typescript
if (isApiSuccess(response)) {
  console.log(response.data);
}
```

---

## Implementation Guidelines

### For API Endpoints

1. **Import Response Types**: Always import the specific response type from `$lib/types/api-responses`
2. **Use `satisfies` Keyword**: Ensure data matches the expected type structure
3. **Return Only Safe Fields**: Never expose passwords, internal IDs, or sensitive metadata
4. **Handle Errors Consistently**: Use standardized error messages and codes
5. **Document Excluded Fields**: Add comments about what fields are intentionally omitted

**Example**:
```typescript
import type { LoginResponse, AuthUserResponse } from '$lib/types/api-responses';

export const POST: RequestHandler = async ({ request, cookies }) => {
  // ... authentication logic ...

  const response: LoginResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      image: user.image,
    } satisfies AuthUserResponse,
  };

  return json(response);
};
```

### For Frontend Consumers

1. **Import Types**: Use the response types when calling APIs
2. **Type Assertions**: Avoid `as` assertions; use type guards instead
3. **Error Handling**: Always check for error responses before accessing data
4. **Autocomplete**: Leverage TypeScript intellisense for available fields

**Example**:
```typescript
import type { LoginResponse } from '$lib/types/api-responses';
import { isApiError } from '$lib/types/api-responses';

const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (isApiError(data)) {
  // Handle error
  console.error(data.error);
} else {
  // data is typed as LoginResponse
  console.log(data.user.email);
}
```

---

## Security Considerations

### Fields Always Excluded

- **Passwords**: Never returned in any response
- **Session Tokens**: Only set as httpOnly cookies
- **Internal IDs**: Database-specific identifiers
- **Soft Delete Flags**: `isDeleted`, `deletedAt`
- **Audit Fields**: `createdBy`, `updatedBy` (unless explicitly needed)
- **API Keys**: External service credentials
- **Admin Notes**: Internal comments or annotations

### Data Sanitization

- **Email Addresses**: Only return user's own email
- **Personal Information**: Follow GDPR/privacy regulations
- **Financial Data**: Mask sensitive payment information
- **IP Addresses**: Log internally, don't expose to clients
- **Device Information**: Aggregate, don't expose raw data

---

## Maintenance

### Adding New API Endpoints

1. Define response type in `/src/lib/types/api-responses.ts`
2. Document fields in this file
3. Implement typed response in the endpoint handler
4. Add tests for response structure
5. Update API consumers to use the new type

### Modifying Existing Responses

1. **Breaking Changes**: Create new response version
2. **Non-Breaking**: Add optional fields only
3. **Deprecation**: Mark old fields with JSDoc `@deprecated`
4. **Migration**: Provide migration guide for consumers

---

## Testing

### Response Type Validation

```typescript
import { describe, it, expect } from 'vitest';
import type { LoginResponse } from '$lib/types/api-responses';

describe('Login API', () => {
  it('should return correctly typed response', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
    });
    
    const data: LoginResponse = await response.json();
    
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
    expect(data.user).not.toHaveProperty('password');
  });
});
```

---

## Related Documentation

- [Database Schema](/src/lib/db/schema/)
- [Type Definitions](/src/lib/types/)
- [Authentication Guide](/docs/authentication.md)
- [API Rate Limiting](/docs/rate-limiting.md)

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0  
**Maintainer**: Development Team
