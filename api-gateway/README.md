# DOA Market API Gateway

API Gateway for the DOA Market microservices architecture. Provides unified entry point, authentication, rate limiting, and request routing to backend services.

## Features

- **Unified API Entry Point**: Single endpoint for all microservices
- **JWT Authentication**: Centralized authentication and authorization
- **Rate Limiting**: Protects services from abuse
- **Role-Based Access Control (RBAC)**: Restricts access based on user roles
- **Request Logging**: Comprehensive logging with Winston
- **Security Headers**: Helmet.js for security best practices
- **Health Checks**: Monitor gateway status
- **CORS Configuration**: Configurable cross-origin resource sharing

## Architecture

The API Gateway routes requests to the following services:

| Service | Port | Auth Required | Roles |
|---------|------|---------------|-------|
| Auth Service | 3001 | No | - |
| User Service | 3002 | Yes | All |
| Product Service | 3003 | Optional | - |
| Order Service | 3004 | Yes | All |
| Payment Service | 3005 | Yes | All |
| Shipping Service | 3006 | Yes | All |
| Seller Service | 3007 | Yes | seller, admin |
| Settlement Service | 3008 | Yes | seller, admin |
| Coupon Service | 3009 | Optional | - |
| Inventory Service | 3010 | Yes | All |
| Notification Service | 3011 | Yes | All |
| Review Service | 3012 | Optional | - |
| Search Service | 3013 | No | - |
| Admin Service | 3014 | Yes | admin |
| File Service | 3015 | Yes | All |
| Stats Service | 3016 | Yes | admin, seller |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Environment variables:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT (must match auth-service)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

Build image:

```bash
docker build -t doa-api-gateway .
```

Run container:

```bash
docker run -p 3000:3000 --env-file .env doa-api-gateway
```

Or use docker-compose:

```bash
docker-compose up api-gateway
```

## API Usage

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

The token is obtained from the auth service:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

### Example Requests

#### Get Products (No Auth Required)

```bash
curl http://localhost:3000/api/v1/products
```

#### Get User Profile (Auth Required)

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/users/me
```

#### Admin Endpoint (Admin Role Required)

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/v1/admin/users
```

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Response:

```json
{
  "success": true,
  "data": {
    "service": "api-gateway",
    "status": "healthy",
    "timestamp": "2025-12-12T10:30:00.000Z",
    "uptime": 123.456
  }
}
```

## Rate Limiting

The gateway implements rate limiting to protect services:

- **General Endpoints**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 attempts per 15 minutes per IP (login, register, refresh)

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later."
}
```

## Authentication Middleware

The gateway forwards user information to backend services via headers:

```http
x-user-id: <user-id>
x-user-email: <user-email>
x-user-role: <user-role>
```

Backend services can use these headers for additional validation or logging.

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied. Required roles: admin"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Route not found"
}
```

### 502 Bad Gateway

```json
{
  "success": false,
  "error": "Bad Gateway",
  "message": "Service unavailable: http://localhost:3001"
}
```

## Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **JWT Validation**: Ensures only authenticated users access protected resources
- **Role-Based Access Control**: Restricts access based on user roles

## Monitoring

The gateway uses Winston for structured logging:

```
[timestamp] info: API Gateway running on port 3000
[timestamp] info: Proxying GET /api/v1/products to http://localhost:3003
[timestamp] info: Authenticated user: user@example.com (customer)
[timestamp] error: Proxy error for http://localhost:3003: ECONNREFUSED
```

## Development

### Project Structure

```
src/
├── middleware/
│   ├── auth.middleware.ts       # JWT authentication
│   └── rateLimiter.middleware.ts # Rate limiting
├── utils/
│   └── logger.ts                # Winston logger
└── server.ts                    # Main application
```

### Adding New Service Routes

Edit `server.ts` and add to the `services` array:

```typescript
{
  path: '/api/v1/newservice',
  target: 'http://localhost:3017',
  auth: 'required',
  roles: ['admin']
}
```

## Troubleshooting

### Service Unavailable (502)

Ensure all backend services are running:

```bash
docker-compose ps
```

### Token Expired

Refresh the token using the refresh endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh-token>"}'
```

### Rate Limit Exceeded

Wait for the rate limit window to reset (15 minutes) or contact support for increased limits.

## Contributing

1. Ensure TypeScript compilation succeeds: `npm run build`
2. Test locally with `npm run dev`
3. Follow existing code patterns for middleware and routing

## License

Proprietary - DOA Market
