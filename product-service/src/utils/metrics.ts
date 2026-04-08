import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export class MetricsService {
  public readonly register: Registry;
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestTotal: Counter<string>;
  public readonly httpRequestErrors: Counter<string>;
  public readonly dbConnectionPool: Gauge<string>;
  public readonly activeConnections: Gauge<string>;

  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.register = new Registry();
    this.register.setDefaultLabels({ service: serviceName });

    collectDefaultMetrics({ register: this.register, prefix: 'nodejs_' });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });

    this.dbConnectionPool = new Gauge({
      name: 'db_connection_pool_active',
      help: 'Number of active database connections',
      labelNames: ['pool'],
      registers: [this.register],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections to the service',
      registers: [this.register],
    });
  }

  public metricsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      this.activeConnections.inc();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.baseUrl || req.path || '/';
        const method = req.method;
        const statusCode = res.statusCode.toString();

        this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
        this.httpRequestTotal.inc({ method, route, status_code: statusCode });

        if (res.statusCode >= 400) {
          const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
          this.httpRequestErrors.inc({ method, route, error_type: errorType });
        }

        this.activeConnections.dec();
      });

      next();
    };
  }

  public updateDbPoolMetrics(poolName: string, activeConnections: number) {
    this.dbConnectionPool.set({ pool: poolName }, activeConnections);
  }

  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  public getContentType(): string {
    return this.register.contentType;
  }
}

export const createMetricsService = (serviceName: string): MetricsService => {
  return new MetricsService(serviceName);
};
