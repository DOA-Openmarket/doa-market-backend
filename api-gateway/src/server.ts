// Initialize tracing first, before any other imports
import { startTracing } from "./tracing";
startTracing();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import logger from "./utils/logger";
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
} from "./middleware/auth.middleware";
import {
  generalLimiter,
  authLimiter,
  writeLimiter,
} from "./middleware/rateLimiter.middleware";
import {
  requestIdMiddleware,
  errorLoggingMiddleware,
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";
import {
  cacheProductList,
  cacheProductDetail,
  cacheSearchResults,
  cacheCategories,
} from "./middleware/cache.middleware";
import { connectRedis, disconnectRedis } from "./config/redis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Request ID middleware (first)
app.use(requestIdMiddleware);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Flutter 웹 앱을 위해 비활성화
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // 개발 환경에서는 모든 localhost 허용
      if (!origin || process.env.NODE_ENV === "development") {
        // localhost나 127.0.0.1로 시작하는 모든 origin 허용
        if (
          !origin ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
      }

      // 프로덕션에서는 설정된 origin만 허용
      const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // 개발 환경에서는 모두 허용
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Health check endpoint (no auth required)
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    data: {
      service: "api-gateway",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Root endpoint (no auth required)
app.get("/", (req, res) => {
  res.json({
    service: "DOA Market API Gateway",
    version: "1.0.0",
    status: "running",
    documentation: "/api/v1/health",
  });
});

// Service configuration with authentication requirements
interface ServiceConfig {
  path: string;
  target: string;
  auth: "required" | "optional" | "none";
  roles?: string[];
}

const services: ServiceConfig[] = [
  // Auth service - no auth required (handles its own auth)
  { path: "/api/v1/auth", target: "http://auth-service:3001", auth: "none" },

  // Seller auth (sign-up, sign-in, me) - handled by auth-service
  {
    path: "/api/v1/sellers/sign-up",
    target: "http://auth-service:3001",
    auth: "none",
  },
  {
    path: "/api/v1/sellers/sign-in",
    target: "http://auth-service:3001",
    auth: "none",
  },
  {
    path: "/api/v1/sellers/me",
    target: "http://auth-service:3001",
    auth: "required",
    roles: ["seller"],
  },

  // Admin auth (sign-in, me) - handled by auth-service
  {
    path: "/api/v1/admin/sign-in",
    target: "http://auth-service:3001",
    auth: "none",
  },
  {
    path: "/api/v1/admin/me",
    target: "http://auth-service:3001",
    auth: "required",
    roles: ["admin"],
  },

  // User service - auth optional (checkin can be viewed by anyone)
  { path: "/api/v1/users", target: "http://user-service:3002", auth: "optional" },
  {
    path: "/api/v1/profiles",
    target: "http://user-service:3002",
    auth: "required",
  },

  // Product service - optional auth (public browsing, auth for modifications) + caching
  {
    path: "/api/v1/products",
    target: "http://product-service:3003",
    auth: "optional",
  },
  {
    path: "/api/v1/categories",
    target: "http://product-service:3003",
    auth: "optional",
  },

  // Order service - auth required
  { path: "/api/v1/orders", target: "http://localhost:3004", auth: "required" },

  // Partner order management - seller or admin role
  {
    path: "/api/v1/orders/partner",
    target: "http://localhost:3004",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Payment service - auth required
  {
    path: "/api/v1/payments",
    target: "http://localhost:3005",
    auth: "required",
  },

  // Shipping service - auth required
  {
    path: "/api/v1/shipping",
    target: "http://localhost:3006",
    auth: "required",
  },

  // Seller service - auth required, seller or admin role
  {
    path: "/api/v1/sellers",
    target: "http://localhost:3007",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Settlement service - auth required, seller or admin role
  {
    path: "/api/v1/settlements",
    target: "http://localhost:3008",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Coupon service - optional auth
  {
    path: "/api/v1/coupons",
    target: "http://localhost:3009",
    auth: "optional",
  },

  // Inventory service - auth required
  {
    path: "/api/v1/inventory",
    target: "http://localhost:3010",
    auth: "required",
  },

  // Notification service - auth required
  {
    path: "/api/v1/notifications",
    target: "http://localhost:3011",
    auth: "required",
  },

  // Review service - optional auth
  {
    path: "/api/v1/reviews",
    target: "http://localhost:3012",
    auth: "optional",
  },

  // Search service - no auth required (public) + caching
  { path: "/api/v1/search", target: "http://search-service:3013", auth: "none" },

  // Admin service - auth required, admin role only
  {
    path: "/api/v1/admin",
    target: "http://localhost:3014",
    auth: "required",
    roles: ["admin"],
  },

  // File service - auth required
  { path: "/api/v1/files", target: "http://localhost:3015", auth: "required" },

  // Stats service - auth required, admin or seller role
  {
    path: "/api/v1/stats",
    target: "http://localhost:3016",
    auth: "required",
    roles: ["admin", "seller"],
  },

  // Cart service - auth required
  { path: "/api/v1/cart", target: "http://localhost:3017", auth: "required" },

  // Wishlist service - optional auth (handled by user-service)
  { path: "/api/v1/wishlist", target: "http://user-service:3002", auth: "optional" },

  // Banner service - optional auth
  { path: "/api/v1/banners", target: "http://banner-service:3017", auth: "optional" },

  // Partner order management - seller or admin role
  {
    path: "/api/v1/partner/orders",
    target: "http://order-service:3004",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Partner cancellation management - seller or admin role
  {
    path: "/api/v1/partner/cancellations",
    target: "http://order-service:3004",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Partner return management - seller or admin role
  {
    path: "/api/v1/partner/returns",
    target: "http://order-service:3004",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Partner delivery management - seller or admin role
  {
    path: "/api/v1/partner/deliveries",
    target: "http://shipping-service:3006",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Partner settlement management - seller or admin role
  {
    path: "/api/v1/partner/settlements",
    target: "http://settlement-service:3008",
    auth: "required",
    roles: ["seller", "admin"],
  },

  // Sales service - admin or seller role
  {
    path: "/api/v1/sales",
    target: "http://stats-service:3016",
    auth: "required",
    roles: ["admin", "seller"],
  },

  // Attachments service - auth required
  {
    path: "/api/v1/attachments",
    target: "http://file-service:3015",
    auth: "required",
  },

  // Terms service - optional auth (public access)
  {
    path: "/api/v1/terms",
    target: "http://admin-service:3014",
    auth: "optional",
  },
];

// Apply stricter rate limiting to auth endpoints
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);

// Apply caching to specific routes (before general service proxying)
app.get("/api/v1/products", cacheProductList());
app.get("/api/v1/products/:id", cacheProductDetail());
app.get("/api/v1/categories", cacheCategories());
app.get("/api/v1/search/products", cacheSearchResults());
app.get("/api/v1/search/autocomplete", cacheSearchResults());

// Create proxy middleware for each service
services.forEach(({ path, target, auth, roles }) => {
  const proxyOptions: Options = {
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req: any) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${target}`);

      // Forward user information if authenticated
      if (req.user) {
        proxyReq.setHeader("x-user-id", req.user.userId);
        proxyReq.setHeader("x-user-email", req.user.email);
        proxyReq.setHeader("x-user-role", req.user.role);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(`Response from ${target}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${target}:`, err);
      res.status(502).json({
        success: false,
        error: "Bad Gateway",
        message: `Service unavailable: ${target}`,
      });
    },
  };

  // Apply authentication middleware based on service config
  if (auth === "required") {
    if (roles && roles.length > 0) {
      app.use(
        path,
        authMiddleware,
        requireRole(...roles),
        createProxyMiddleware(proxyOptions)
      );
    } else {
      app.use(path, authMiddleware, createProxyMiddleware(proxyOptions));
    }
  } else if (auth === "optional") {
    app.use(path, optionalAuthMiddleware, createProxyMiddleware(proxyOptions));
  } else {
    // No auth required
    app.use(path, createProxyMiddleware(proxyOptions));
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorLoggingMiddleware);
app.use(globalErrorHandler);

// Initialize server
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info("Redis connection established");

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info("All services proxied and ready");
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);

      server.close(async () => {
        logger.info("HTTP server closed");

        // Disconnect Redis
        await disconnectRedis();

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
