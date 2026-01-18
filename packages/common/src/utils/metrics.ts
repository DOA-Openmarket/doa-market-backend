import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export class MetricsService {
  public readonly register: Registry;

  // HTTP metrics
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestTotal: Counter<string>;
  public readonly httpRequestErrors: Counter<string>;

  // Application metrics
  public readonly dbConnectionPool: Gauge<string>;
  public readonly activeConnections: Gauge<string>;

  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.register = new Registry();
    this.register.setDefaultLabels({ service: serviceName });

    // Collect default metrics (CPU, memory, GC, event loop, etc.)
    collectDefaultMetrics({
      register: this.register,
      prefix: 'nodejs_',
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10], // 10ms to 10s
      registers: [this.register],
    });

    // HTTP request counter
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP errors counter
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });

    // Database connection pool gauge
    this.dbConnectionPool = new Gauge({
      name: 'db_connection_pool_active',
      help: 'Number of active database connections',
      labelNames: ['pool'],
      registers: [this.register],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections to the service',
      registers: [this.register],
    });
  }

  /**
   * Express middleware to track HTTP metrics
   */
  public metricsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      // Increment active connections
      this.activeConnections.inc();

      // Track response
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = this.getRoute(req);
        const method = req.method;
        const statusCode = res.statusCode.toString();

        // Record duration
        this.httpRequestDuration.observe(
          { method, route, status_code: statusCode },
          duration
        );

        // Increment request counter
        this.httpRequestTotal.inc({
          method,
          route,
          status_code: statusCode,
        });

        // Track errors
        if (res.statusCode >= 400) {
          const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
          this.httpRequestErrors.inc({
            method,
            route,
            error_type: errorType,
          });
        }

        // Decrement active connections
        this.activeConnections.dec();
      });

      next();
    };
  }

  /**
   * Get normalized route path from request
   */
  private getRoute(req: Request): string {
    // Try to get route from express route
    if (req.route?.path) {
      return req.route.path;
    }

    // Fallback to base path
    if (req.baseUrl) {
      return req.baseUrl;
    }

    // Normalize path (remove IDs, UUIDs, etc.)
    let path = req.path || '/';

    // Replace UUIDs
    path = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id'
    );

    // Replace numeric IDs
    path = path.replace(/\/\d+/g, '/:id');

    return path;
  }

  /**
   * Update database connection pool metrics
   */
  public updateDbPoolMetrics(poolName: string, activeConnections: number) {
    this.dbConnectionPool.set({ pool: poolName }, activeConnections);
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics content type
   */
  public getContentType(): string {
    return this.register.contentType;
  }
}

/**
 * Factory function to create a MetricsService instance
 */
export const createMetricsService = (serviceName: string): MetricsService => {
  return new MetricsService(serviceName);
};

/**
 * Export types for use in services
 */
export { Counter, Histogram, Gauge } from 'prom-client';
