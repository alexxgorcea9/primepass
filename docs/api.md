# PrimePass API Documentation

## Overview

The PrimePass API is a RESTful API built with Django REST Framework that provides endpoints for managing high-ticket events, user authentication, registrations, and analytics.

## Base URL

```
Development: http://localhost:8000/api/v1/
Production: https://api.primepass.com/api/v1/
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining Tokens

```http
POST /auth/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Refreshing Tokens

```http
POST /auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/token/` | Obtain JWT tokens |
| POST | `/auth/token/refresh/` | Refresh access token |
| POST | `/auth/token/verify/` | Verify token validity |
| POST | `/auth/register/` | User registration |
| POST | `/auth/forgot-password/` | Request password reset |
| POST | `/auth/reset-password/` | Reset password |
| GET | `/auth/profile/` | Get user profile |
| PUT | `/auth/profile/` | Update user profile |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/` | List events |
| POST | `/events/` | Create event |
| GET | `/events/{id}/` | Get event details |
| PUT | `/events/{id}/` | Update event |
| DELETE | `/events/{id}/` | Delete event |
| POST | `/events/{id}/register/` | Register for event |
| DELETE | `/events/{id}/unregister/` | Unregister from event |
| POST | `/events/{id}/checkin/` | Check in to event |
| GET | `/events/{id}/analytics/` | Get event analytics |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | List notifications |
| POST | `/notifications/{id}/mark-read/` | Mark notification as read |
| POST | `/notifications/mark-all-read/` | Mark all notifications as read |
| GET | `/notifications/preferences/` | Get notification preferences |
| PUT | `/notifications/preferences/` | Update notification preferences |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard/` | Get dashboard analytics |
| GET | `/analytics/events/` | Get events analytics |
| GET | `/analytics/users/` | Get user analytics |
| GET | `/analytics/revenue/` | Get revenue analytics |

## Request/Response Format

### Standard Response Format

```json
{
  "success": true,
  "data": {
    "example": "Response data goes here"
  },
  "message": "Operation completed successfully"
}
```

### Error Response Format

```json
{
  "success": false,
  "errors": {
    "field_name": ["Error message"]
  },
  "message": "Validation failed"
}
```

### Pagination

List endpoints return paginated results:

```json
{
  "count": 100,
  "next": "http://api.example.com/events/?page=3",
  "previous": "http://api.example.com/events/?page=1",
  "results": [
    "Array of objects goes here"
  ]
}
```

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "dateJoined": "2023-01-01T00:00:00Z",
  "profile": {
    "bio": "Event organizer",
    "website": "https://johndoe.com",
    "location": "New York, NY",
    "timezone": "America/New_York"
  }
}
```

### Event

```json
{
  "id": "uuid",
  "title": "High-Ticket Masterclass",
  "description": "Learn advanced strategies...",
  "slug": "high-ticket-masterclass",
  "organizer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "startDate": "2023-12-01T18:00:00Z",
  "endDate": "2023-12-01T20:00:00Z",
  "timezone": "America/New_York",
  "location": {
    "type": "virtual",
    "virtualUrl": "https://zoom.us/j/123456789"
  },
  "status": "published",
  "visibility": "public",
  "capacity": 100,
  "registeredCount": 45,
  "tiers": [
    {
      "id": "uuid",
      "name": "VIP Access",
      "price": 497,
      "currency": "USD",
      "capacity": 20,
      "soldCount": 15
    }
  ]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API requests are rate limited:

- Authenticated users: 1000 requests per hour
- Anonymous users: 100 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

PrimePass supports webhooks for real-time event notifications:

### Supported Events

- `event.created` - New event created
- `event.updated` - Event updated
- `registration.created` - New registration
- `registration.cancelled` - Registration cancelled
- `payment.completed` - Payment completed

### Webhook Payload

```json
{
  "event": "registration.created",
  "data": {
    "id": "uuid",
    "event": "uuid",
    "user": "uuid",
    "tier": "uuid",
    "createdAt": "2023-01-01T00:00:00Z"
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## SDKs and Libraries

- JavaScript/TypeScript: `@primepass/js-sdk`
- Python: `primepass-python`
- PHP: `primepass-php`

## Support

For API support, contact:
- Email: api-support@primepass.com
- Documentation: https://docs.primepass.com
- Status Page: https://status.primepass.com
