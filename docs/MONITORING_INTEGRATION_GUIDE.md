# 서비스 모니터링 통합 가이드

이 가이드는 나머지 서비스들에 Prometheus 메트릭을 통합하는 방법을 설명합니다.

## ✅ 이미 통합된 서비스

- ✅ product-service
- ✅ user-service
- ✅ packages/common (공유 라이브러리)

## 📝 통합해야 할 서비스 (16개)

1. api-gateway
2. auth-service
3. order-service
4. payment-service
5. cart-service
6. review-service
7. notification-service
8. search-service
9. inventory-service
10. seller-service
11. admin-service
12. file-service
13. banner-service
14. coupon-service
15. shipping-service
16. stats-service
17. settlement-service

## 🔧 통합 단계

각 서비스에 대해 다음 단계를 반복합니다:

### 1단계: 의존성 확인

서비스의 `package.json`이 `@doa-market/common`을 이미 포함하고 있는지 확인합니다. 포함되어 있지 않다면 추가합니다:

```json
{
  "dependencies": {
    "@doa-market/common": "^1.0.0"
  }
}
```

그리고 npm install 실행:
```bash
cd <service-directory>
npm install
```

### 2단계: 메인 파일 수정

서비스의 `src/index.ts` 또는 `src/server.ts` 파일을 수정합니다.

#### import 추가

파일 상단에 다음을 추가:

```typescript
import { createMetricsService } from '@doa-market/common';
```

#### metrics 인스턴스 생성

Express app 생성 후, 바로 다음에 추가:

```typescript
const app = express();

// Initialize metrics
const metrics = createMetricsService('your-service-name'); // 서비스 이름으로 변경

// Apply metrics middleware EARLY (before other middleware)
app.use(metrics.metricsMiddleware());
```

#### /metrics 엔드포인트 추가

/health 엔드포인트 바로 다음에 추가:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'your-service', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.getContentType());
  res.end(await metrics.getMetrics());
});
```

### 3단계: DB 커넥션 메트릭 (선택사항)

서비스가 Sequelize를 사용하는 경우, startServer 함수 내부에 다음을 추가:

```typescript
app.listen(PORT, () => logger.info(`Service on ${PORT}`));

// Update DB connection pool metrics periodically
setInterval(() => {
  try {
    if (sequelize.connectionManager && sequelize.connectionManager.pool) {
      const pool = sequelize.connectionManager.pool;
      const activeConnections = pool.size - pool.available;
      metrics.updateDbPoolMetrics('postgres', activeConnections);
    }
  } catch (error) {
    // Silently ignore errors in metrics collection
  }
}, 10000); // Update every 10 seconds
```

## 📋 완전한 예제

### product-service 예제 (참고용)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { createEventBus } from './events/eventBus';
import { createMetricsService } from '@doa-market/common';  // ← 추가

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize event bus
export const eventBus = createEventBus('product-service');

// Initialize metrics  ← 추가
const metrics = createMetricsService('product-service');

// Apply metrics middleware early  ← 추가
app.use(metrics.metricsMiddleware());

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    const allowedOrigins = ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service', timestamp: new Date().toISOString() });
});

// Metrics endpoint  ← 추가
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.getContentType());
  res.end(await metrics.getMetrics());
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Product Service API Docs',
}));

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });

    const rabbitmqEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (rabbitmqEnabled) {
      await eventBus.connect();
      logger.info('Event bus connected');
    } else {
      logger.info('RabbitMQ is disabled, running without event bus');
    }

    app.listen(PORT, () => logger.info(`Product Service on ${PORT}`));

    // Update DB connection pool metrics periodically  ← 추가
    setInterval(() => {
      try {
        if (sequelize.connectionManager && sequelize.connectionManager.pool) {
          const pool = sequelize.connectionManager.pool;
          const activeConnections = pool.size - pool.available;
          metrics.updateDbPoolMetrics('postgres', activeConnections);
        }
      } catch (error) {
        // Silently ignore
      }
    }, 10000);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      if (rabbitmqEnabled) {
        await eventBus.disconnect();
      }
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
export default app;
```

## ✅ 검증 방법

각 서비스 통합 후:

### 1. 로컬에서 테스트

```bash
cd <service-directory>
npm run dev

# 별도 터미널에서
curl http://localhost:<PORT>/metrics
```

성공하면 Prometheus 형식의 메트릭이 출력됩니다:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200",service="product-service"} 1

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
...
```

### 2. Docker 이미지 빌드 테스트

```bash
docker build -t test-service:latest .
docker run -p 3000:3000 test-service:latest

curl http://localhost:3000/metrics
```

### 3. Kubernetes에 배포 후 확인

```bash
# Pod 생성 확인
kubectl get pods -n doa-market-prod -l app=<service-name>

# 메트릭 엔드포인트 확인
kubectl port-forward -n doa-market-prod svc/<service-name> 3000:80
curl http://localhost:3000/metrics

# ServiceMonitor 확인
kubectl get servicemonitors -n doa-market-prod -l app=<service-name>

# Prometheus targets 확인 (Prometheus UI)
# Status → Targets에서 <service-name>이 UP 상태인지 확인
```

## 🐛 문제 해결

### 메트릭 엔드포인트가 404 반환

- `/metrics` 엔드포인트가 올바르게 추가되었는지 확인
- 미들웨어 순서 확인 (metrics middleware가 초반에 있어야 함)

### "Cannot find module '@doa-market/common'"

```bash
# packages/common 빌드
cd packages/common
npm run build

# 서비스에서 재설치
cd ../../<service-directory>
rm -rf node_modules package-lock.json
npm install
```

### 메트릭이 Prometheus에 나타나지 않음

1. ServiceMonitor가 생성되었는지 확인:
```bash
kubectl get servicemonitors -n doa-market-prod
```

2. Prometheus Operator 로그 확인:
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus-operator
```

3. Prometheus targets에서 서비스 상태 확인
4. 서비스 Pod의 어노테이션 확인:
```bash
kubectl get pod -n doa-market-prod -l app=<service-name> -o yaml | grep -A 3 annotations
```

## 📊 수집되는 메트릭

각 서비스에서 자동으로 수집되는 메트릭:

### HTTP 메트릭
- `http_requests_total`: 총 HTTP 요청 수 (method, route, status_code별)
- `http_request_duration_seconds`: HTTP 요청 처리 시간 (히스토그램)
- `http_request_errors_total`: HTTP 에러 수 (error_type별)

### Node.js 기본 메트릭
- `nodejs_heap_size_total_bytes`: Heap 메모리 총량
- `nodejs_heap_size_used_bytes`: 사용 중인 Heap 메모리
- `nodejs_external_memory_bytes`: External 메모리
- `nodejs_eventloop_lag_seconds`: Event loop 지연
- `nodejs_gc_duration_seconds`: GC 실행 시간

### 애플리케이션 메트릭
- `db_connection_pool_active`: 활성 DB 커넥션 수
- `active_connections`: 활성 HTTP 커넥션 수

## 🎯 다음 단계

모든 서비스에 메트릭을 통합한 후:

1. **Grafana 대시보드 생성**
   - 서비스별 성능 대시보드
   - 전체 시스템 개요 대시보드
   - 비즈니스 메트릭 대시보드

2. **커스텀 메트릭 추가**
   - 비즈니스 로직에 특화된 메트릭
   - 예: 주문 생성 수, 결제 성공/실패율, 재고 부족 횟수 등

3. **SLI/SLO 설정**
   - 서비스 수준 목표 정의
   - Error Budget 추적

4. **알림 룰 최적화**
   - False Positive 줄이기
   - 알림 우선순위 조정

## 📚 참고 자료

- [Prometheus 메트릭 타입](https://prometheus.io/docs/concepts/metric_types/)
- [prom-client 라이브러리](https://github.com/siimon/prom-client)
- [Prometheus 베스트 프랙티스](https://prometheus.io/docs/practices/naming/)
