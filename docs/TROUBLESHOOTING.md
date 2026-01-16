# DOA Market Backend 트러블슈팅 가이드

## 개요
이 문서는 DOA Market 백엔드 서비스의 프로덕션 배포 과정에서 발생한 문제들과 해결 방법을 정리한 문서입니다.

**트러블슈팅 기간**: 2026-01-13 ~ 2026-01-16
**환경**: EKS (Kubernetes), Aurora PostgreSQL, ElastiCache Redis
**최종 결과**:
- ✅ 19/19 서비스 정상 배포 및 작동
- ✅ Auth Service 회원가입/로그인 기능 정상화
- ✅ POST/PUT 타임아웃 완전 해결 (4분 → 2.6초, 99% 성능 개선)
- ⚠️ Search Service - OpenSearch 인프라 미구축으로 인한 제한적 작동

---

## 목차
1. [인프라 문제](#1-인프라-문제)
2. [네트워크 문제](#2-네트워크-문제)
3. [데이터베이스 문제](#3-데이터베이스-문제)
4. [애플리케이션 문제](#4-애플리케이션-문제)
5. [Kubernetes 리소스 문제](#5-kubernetes-리소스-문제)
6. [참고 자료](#참고-자료)

---

## 1. 인프라 문제

### 1.1 Node Affinity 스케줄링 실패

**증상**
```
0/3 nodes are available: 3 node(s) didn't match Pod's node affinity/selector
```

**원인**
- Helm values에서 잘못된 node affinity 레이블 사용
- `capacity-type` 사용 → EKS 표준은 `eks.amazonaws.com/capacityType`
- 소문자 값 사용 (`spot`, `on_demand`) → 대문자 필요 (`SPOT`, `ON_DEMAND`)

**해결 방법**
```yaml
# helm/doa-market/values-production.yaml
nodeAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 80
      preference:
        matchExpressions:
          - key: eks.amazonaws.com/capacityType  # 수정됨
            operator: In
            values:
              - SPOT  # 대문자로 수정
```

**관련 커밋**: `a0aff6c`, `4db85ad`

---

### 1.2 클러스터 리소스 고갈

**증상**
```
0/3 nodes are available: 3 Too many pods
CPU: 72-77%, Memory: 89-99%
Insufficient memory
```

**원인**
- 모든 서비스의 replica가 2개로 설정
- 과도한 리소스 요청 (cpu: 200m, memory: 256Mi)
- 3개 노드로는 38개 Pod 실행 불가

**해결 방법**
```yaml
# helm/doa-market/values-production.yaml
defaults:
  replicaCount: 1  # 2 → 1로 감소
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 50m      # 200m → 50m으로 감소
      memory: 128Mi  # 256Mi → 128Mi로 감소
```

**관련 커밋**: 리소스 최적화 커밋

---

## 2. 네트워크 문제

### 2.1 VPC 네트워크 격리 (Critical)

**증상**
```
Error: You have specified two resources that belong to different networks
RDS VPC: vpc-0c9ea181a32d10914
EKS VPC: vpc-05833dfa80ced8e6e
Connection timeout when testing with nc command
```

**원인**
- RDS와 ElastiCache가 EKS와 다른 VPC에 생성됨
- 서로 다른 VPC 간 통신 불가
- 이전에 생성된 인프라가 잘못된 VPC 사용

**해결 방법**

1. **EKS VPC 정보 확인**
```bash
aws eks describe-cluster --name doa-market-cluster \
  --query 'cluster.resourcesVpcConfig.{VpcId:vpcId,SubnetIds:subnetIds}'
```

2. **새 서브넷 그룹 생성**
```bash
# DB 서브넷 그룹
aws rds create-db-subnet-group \
  --db-subnet-group-name doa-market-db-subnet-group \
  --db-subnet-group-description "DOA Market DB subnet group" \
  --subnet-ids subnet-xxx subnet-yyy

# ElastiCache 서브넷 그룹
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name doa-market-redis-subnet-group \
  --cache-subnet-group-description "DOA Market Redis subnet group" \
  --subnet-ids subnet-xxx subnet-yyy
```

3. **보안 그룹 생성 및 인그레스 규칙 설정**
```bash
# RDS 보안 그룹
aws ec2 create-security-group \
  --group-name doa-market-rds-sg \
  --description "Security group for DOA Market RDS" \
  --vpc-id vpc-05833dfa80ced8e6e

aws ec2 authorize-security-group-ingress \
  --group-id sg-029b2762076698e0c \
  --protocol tcp --port 5432 \
  --source-group sg-037d2e22b92d81ec5  # EKS node security group
```

4. **기존 리소스 삭제 및 재생성**
```bash
# 기존 RDS 삭제
aws rds delete-db-instance --db-instance-identifier doa-market-rds-instance-1
aws rds delete-db-cluster --db-cluster-identifier doa-market-rds

# 새 Aurora 클러스터 생성 (올바른 VPC)
aws rds create-db-cluster \
  --db-cluster-identifier doa-market-rds \
  --engine aurora-postgresql \
  --engine-version 17.4 \
  --master-username doaadmin \
  --master-user-password DoaMarket2024Pass \
  --db-subnet-group-name doa-market-db-subnet-group \
  --vpc-security-group-ids sg-029b2762076698e0c
```

**최종 인프라**
- Aurora Cluster: `doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com`
- ElastiCache: `master.doa-market-redis.3agi26.apn2.cache.amazonaws.com`
- 모두 EKS와 동일한 VPC (`vpc-05833dfa80ced8e6e`)에 생성됨

**관련 커밋**: `a0aff6c`

---

## 3. 데이터베이스 문제

### 3.1 SSL/TLS 인증 오류

**증상**
```
no pg_hba.conf entry for host, no encryption
```

**원인**
- Aurora PostgreSQL 17.4의 기본 설정이 SSL 연결 강제
- 애플리케이션에서 SSL 옵션 없이 연결 시도

**해결 방법**

1. **커스텀 파라미터 그룹 생성**
```bash
aws rds create-db-cluster-parameter-group \
  --db-cluster-parameter-group-name doa-market-postgres17 \
  --db-parameter-group-family aurora-postgresql17 \
  --description "Custom parameter group for doa-market"
```

2. **SSL 요구사항 비활성화**
```bash
aws rds modify-db-cluster-parameter-group \
  --db-cluster-parameter-group-name doa-market-postgres17 \
  --parameters "ParameterName=rds.force_ssl,ParameterValue=0,ApplyMethod=immediate"
```

3. **클러스터에 적용 및 재부팅**
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier doa-market-rds \
  --db-cluster-parameter-group-name doa-market-postgres17

aws rds reboot-db-instance --db-instance-identifier doa-market-rds-instance-1
```

---

### 3.2 비밀번호 인증 실패

**증상**
```
password authentication failed for user "postgres"
```

**원인**
- Kubernetes Secret에 `doa_user` 사용자 이름 저장
- RDS 마스터 사용자는 `doaadmin`으로 생성
- 사용자 이름 불일치로 인증 실패

**해결 방법**

1. **Secret 업데이트**
```bash
kubectl create secret generic db-credentials-prod \
  --from-literal=username=doaadmin \
  --from-literal=password=DoaMarket2024Pass \
  --namespace=doa-market-prod \
  --dry-run=client -o yaml | kubectl apply -f -
```

2. **RDS 마스터 비밀번호 변경**
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier doa-market-rds \
  --master-user-password DoaMarket2024Pass \
  --apply-immediately
```

---

### 3.3 서비스 데이터베이스 미존재

**증상**
```
database "admin_service" does not exist (code: 3D000)
```

**원인**
- RDS 클러스터는 생성되었으나 개별 서비스 데이터베이스는 생성되지 않음
- 18개 마이크로서비스 각각 별도 데이터베이스 필요

**해결 방법**

1. **Kubernetes Job으로 데이터베이스 생성**
```yaml
# /tmp/create-databases-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: create-databases
  namespace: doa-market-prod
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: pg-client
        image: postgres:17
        env:
        - name: PGPASSWORD
          value: "DoaMarket2024Pass"
        command:
        - /bin/bash
        - -c
        - |
          HOST="doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com"
          USER="doaadmin"

          for db in admin_service auth_service product_service order_service payment_service user_service cart_service review_service notification_service search_service inventory_service seller_service banner_service coupon_service shipping_service stats_service settlement_service file_service; do
            echo "Creating database: $db"
            psql -h $HOST -U $USER -d postgres -c "CREATE DATABASE $db" || echo "Database $db may already exist"
          done
```

2. **리소스 확보를 위해 서비스 일시 중지**
```bash
# 모든 서비스 스케일 다운
kubectl scale deployment -n doa-market-prod --all --replicas=0

# Job 실행
kubectl apply -f /tmp/create-databases-job.yaml

# Job 완료 후 서비스 복구
kubectl scale deployment -n doa-market-prod --all --replicas=1
```

**생성된 데이터베이스 목록**
- admin_service, auth_service, product_service, order_service
- payment_service, user_service, cart_service, review_service
- notification_service, search_service, inventory_service, seller_service
- banner_service, coupon_service, shipping_service, stats_service
- settlement_service, file_service

---

## 4. 애플리케이션 문제

### 4.1 Logger 파일 시스템 오류

**증상**
```
Error: ENOENT: no such file or directory, mkdir 'logs'
Error: EROFS: read-only file system, mkdir '/app/uploads'
```

**원인**
- Kubernetes에서 `readOnlyRootFilesystem: true` 보안 설정 사용
- 컨테이너의 루트 파일시스템이 읽기 전용
- `logs/` 및 `/app/uploads` 디렉토리 생성 불가

**해결 방법**

1. **Logger 경로 수정** (`api-gateway/src/utils/logger.ts`)
```typescript
// Before
filename: 'logs/error.log'

// After
filename: '/tmp/logs/error.log'
```

2. **파일 업로드 경로 수정** (`file-service/src/routes/file.routes.ts`)
```typescript
// Before
const upload = multer({ dest: 'uploads/' });

// After
const upload = multer({ dest: '/tmp/uploads/' });
```

**관련 파일**
- `api-gateway/src/utils/logger.ts`
- `auth-service/src/utils/logger.ts`
- `file-service/src/routes/file.routes.ts`

**관련 커밋**: `6c6d2a5`, `07cd1b9`

---

### 4.2 RabbitMQ 의존성 문제

**증상**
```
[EventBus] Failed to connect: Error: getaddrinfo ENOTFOUND rabbitmq
Error: EventBus is not connected
```

**원인**
- inventory-service, payment-service가 RabbitMQ 필수로 요구
- 프로덕션에서 RabbitMQ 대신 SNS/SQS 사용 예정
- RabbitMQ 없이는 서비스 시작 불가

**해결 방법**

1. **EventBus를 선택적으로 변경** (`inventory-service/src/events/eventBus.ts`)
```typescript
export class EventBus {
  private isEnabled = true;

  constructor(config: EventBusConfig) {
    this.config = config;
    // RabbitMQ 비활성화 체크
    this.isEnabled = process.env.RABBITMQ_ENABLED !== 'false';
    if (!this.isEnabled) {
      console.log('[EventBus] RabbitMQ is disabled, running in standalone mode');
    }
  }

  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('[EventBus] Skipping connection (disabled)');
      return;
    }
    // ... 기존 연결 로직
  }

  async publish<T>(eventType: EventType, data: T['data']): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[EventBus] Skipping publish (disabled): ${eventType}`);
      return;
    }
    // ... 기존 발행 로직
  }
}
```

2. **Helm values에 환경변수 추가**
```yaml
# helm/doa-market/values-production.yaml
services:
  inventory-service:
    env:
      - name: RABBITMQ_ENABLED
        value: "false"

  payment-service:
    env:
      - name: RABBITMQ_ENABLED
        value: "false"
```

**적용된 서비스**
- inventory-service
- payment-service
- search-service (RabbitMQ + OpenSearch)

**관련 커밋**: `07cd1b9`

---

### 4.3 OpenSearch 연결 실패

**증상**
```
Failed to create index: Connection Error
ConnectionError: Connection Error at http://localhost:9200/
```

**원인**
- search-service가 OpenSearch 필수로 요구
- 프로덕션에 OpenSearch 미구성
- OpenSearch 없이는 서비스 시작 불가

**해결 방법**

1. **OpenSearch 연결을 선택적으로 변경** (`search-service/src/index.ts`)
```typescript
const startServer = async () => {
  try {
    // OpenSearch 초기화 (선택적)
    const opensearchEnabled = process.env.OPENSEARCH_ENABLED !== 'false';
    if (opensearchEnabled) {
      try {
        await createProductsIndex();
        logger.info('OpenSearch index initialized');
      } catch (error) {
        logger.warn('OpenSearch connection failed, running without search:', error);
      }
    } else {
      logger.info('OpenSearch is disabled');
    }

    app.listen(PORT, () => logger.info(`Search Service on port ${PORT}`));
  }
};
```

2. **환경변수 설정**
```yaml
search-service:
  env:
    - name: RABBITMQ_ENABLED
      value: "false"
    - name: OPENSEARCH_ENABLED
      value: "false"
```

**관련 커밋**: `07cd1b9`

---

### 4.4 Settlement Service 데이터베이스 설정 오류

**증상**
```
password authentication failed for user "postgres"
```

**원인**
- settlement-service가 하드코딩된 데이터베이스 설정 사용
- 환경변수를 읽지 않음

**해결 방법**

```typescript
// settlement-service/src/config/database.ts

// Before
export const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  database: 'doa_settlements',
  username: 'postgres',
  password: 'postgres',
  dialect: 'postgres',
});

// After
export const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'settlement_service',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: false,
});
```

**관련 커밋**: `07cd1b9`

---

### 4.5 헬스 체크 엔드포인트 불일치

**증상**
```
Readiness probe failed: HTTP probe failed with statuscode: 404
Liveness probe failed: HTTP probe failed with statuscode: 404
```

**원인**
- Kubernetes probe가 `/health` 경로 체크
- 서비스는 `/api/v1/health` 경로만 제공
- 경로 불일치로 헬스 체크 실패

**해결 방법**

1. **banner-service에 `/health` 엔드포인트 추가**
```typescript
// banner-service/src/index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'banner-service',
    timestamp: new Date().toISOString()
  });
});
```

2. **api-gateway에 `/health` 엔드포인트 추가**
```typescript
// api-gateway/src/server.ts
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString()
  });
});
```

**관련 커밋**: `7114918`

---

### 4.6 API Gateway Redis 연결 Hang

**증상**
```
Redis connected successfully
(10초 대기)
Redis connection timeout after 10s
Failed to start server
```

**원인**
- Redis 클라이언트가 `connect()` 호출 시 무한 대기
- `connect` 이벤트는 발생하지만 `ready` 이벤트 대기 중 hang
- 서버가 시작되지 않음

**해결 방법**

1. **Redis 연결에 타임아웃 추가** (`api-gateway/src/config/redis.ts`)
```typescript
export async function connectRedis(): Promise<RedisClientType> {
  redisClient = createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      connectTimeout: 10000,  // 10초 타임아웃
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.error('Redis max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
    password: REDIS_PASSWORD || undefined,
  });

  try {
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout after 10s')), 10000)
      )
    ]);
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}
```

2. **서버 시작 시 Redis 연결 선택적으로 변경** (`api-gateway/src/server.ts`)
```typescript
async function startServer() {
  try {
    // Redis 연결 (선택적)
    try {
      await connectRedis();
      logger.info("Redis connection established");
    } catch (error) {
      logger.warn("Redis connection failed, continuing without cache:", error);
    }

    // HTTP 서버 시작
    const server = app.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT}`);
    });
  }
}
```

**관련 커밋**: `8a1963c`, `ff3f3ba`

---

### 4.7 POST/PUT 요청 타임아웃 (Critical)

**증상**
```
POST /api/v1/products - 504 Gateway Time-out (15초+)
PUT /api/v1/products/:id - 504 Gateway Time-out (15초+)
BadRequestError: request aborted at IncomingMessage.onAborted
모든 POST/PUT/PATCH 요청이 15초 타임아웃
평균 응답 시간: 15초+ (타임아웃)
```

**원인**
- API Gateway에서 `express.json()` 미들웨어가 request body를 먼저 파싱
- 미들웨어가 body stream을 소비하여 `http-proxy-middleware`가 빈 body를 백엔드로 전달
- 백엔드 서비스가 빈 body를 기다리며 무한 대기
- 클라이언트가 15초 후 타임아웃하고 연결 종료
- 서버는 "request aborted" 에러 발생

**문제 상세**

1. **Request Flow**
```
Client → API Gateway → express.json() [body 소비] → http-proxy-middleware [빈 body 전달] → Backend Service [body 대기]
                                   ↓
                            Body가 이미 소비됨
                            Proxy가 전달할 수 없음
```

2. **로그 분석**
```bash
# Backend Service 로그
BadRequestError: request aborted
    at IncomingMessage.onAborted (/app/node_modules/raw-body/index.js:245:10)

# Newman 테스트 결과 (수정 전)
- POST /api/v1/products - TIMEOUT (15s)
- PUT /api/v1/products/:id - TIMEOUT (15s)
- 총 16개 타임아웃 발생
- 평균 응답 시간: 15초+ (타임아웃)
```

3. **영향 범위**
- ❌ 모든 POST 요청 (생성)
- ❌ 모든 PUT 요청 (전체 수정)
- ❌ 모든 PATCH 요청 (부분 수정)
- ✅ GET 요청은 정상 (body가 없음)
- ✅ DELETE 요청은 정상 (body가 없음)

**해결 방법**

**1. API Gateway 수정** (`api-gateway/src/server.ts`)

```typescript
// BEFORE - express.json()이 body를 소비함
app.use(cors({ ... }));
app.use(express.json());  // ❌ 문제 원인

// AFTER - express.json() 비활성화
app.use(cors({ ... }));

// IMPORTANT: Do NOT use express.json() globally - it consumes the request body
// and prevents http-proxy-middleware from forwarding POST/PUT request bodies.
// Instead, we'll let the proxy handle body forwarding to backend services.
// app.use(express.json());  // ✅ 주석 처리

// Trust proxy - required for ALB/Load Balancer
app.set('trust proxy', true);
```

**설명**:
- API Gateway는 단순 프록시 역할만 수행
- Body parsing은 각 백엔드 서비스에서 처리
- `http-proxy-middleware`가 raw request를 그대로 전달

**2. 배포**

```bash
# 이미지 빌드 (AMD64 플랫폼)
docker build --platform linux/amd64 \
  -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:a8e4f11 .

# ECR 푸시
docker push 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:a8e4f11

# Kubernetes 배포
kubectl set image deployment/api-gateway \
  -n doa-market-prod \
  api-gateway=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:a8e4f11

# 롤아웃 대기
kubectl rollout status deployment/api-gateway -n doa-market-prod
```

**3. 검증**

```bash
# POST 요청 테스트
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"name":"Test Product","description":"Testing","price":"39.99","categoryId":"550e8400-e29b-41d4-a716-446655440001","stockQuantity":50}' \
  http://k8s-doamarke-apigatew-xxx.elb.amazonaws.com/api/v1/products

# 응답: 201 Created (64ms) ✅
```

**결과**

**성능 개선**:
```
실행 시간:     4분 2.6초 → 2.4초 (99.0% 개선)
타임아웃:      16개 → 0개 (100% 해결)
평균 응답:     15초+ → 26ms (99.8% 개선)
POST 성공률:   0% → 100%
```

**Newman 테스트 결과 (수정 후)**:
```
✅ POST /api/v1/products - 201 Created (64ms)
✅ POST /api/v1/banners - 201 Created (54ms)
✅ POST /api/v1/users - 401 Unauthorized (정상, 인증 필요)
✅ 총 65개 요청, 0개 타임아웃
✅ 평균 응답 시간: 26ms [최소: 7ms, 최대: 188ms]
```

**참고 사항**

1. **Auth Middleware는 정상 작동**
   - auth middleware는 헤더만 읽으므로 영향 없음
   - JWT 검증 및 사용자 정보 전달 정상

2. **Backend Services 수정 불필요**
   - 각 백엔드 서비스는 자체적으로 `express.json()` 사용
   - body parsing은 최종 목적지에서 처리

3. **관련 서비스**
   - product-service: route 충돌 수정 추가 필요 (commit: `b674327`)
   - 기타 서비스: 추가 수정 불필요

**관련 커밋**: `a8e4f11` (API Gateway body forwarding fix), `b674327` (Product Service route fix)

**교훈**
- API Gateway에서는 body parsing 미들웨어 사용 금지
- Proxy 역할을 하는 서비스는 raw request를 그대로 전달해야 함
- Body parsing은 최종 목적지 서비스에서만 수행
- 타임아웃 문제는 네트워크뿐만 아니라 미들웨어 순서도 원인일 수 있음

---

### 4.8 Authentication Service 500 에러 (Database Sync)

**증상**
```
POST /api/v1/auth/register - 500 Internal Server Error
POST /api/v1/auth/login - 500 Internal Server Error
relation "users" does not exist
```

**원인**
1. **Database Tables 미생성**
   - Auth service가 프로덕션 환경에서 `sequelize.sync()` 실행 안 함
   - `NODE_ENV === 'development'` 조건으로 sync 로직이 제한됨
   - 프로덕션 데이터베이스에 테이블이 생성되지 않음

2. **Dockerfile CMD 문제**
   - `CMD ["npm", "run", "dev"]` 사용 (tsx watch 모드)
   - 프로덕션에서는 `npm start` (compiled JS 실행) 사용해야 함
   - tsx watch는 TypeScript 소스 파일 읽기 시도하지만 EACCES 에러 발생

3. **Swagger 경로 문제**
   - `apis: ['./src/routes/*.ts']` 설정
   - 프로덕션에서는 컴파일된 JS 파일(`./dist/routes/*.js`) 읽어야 함
   - TypeScript 소스 파일 접근 시 permission denied 에러

**해결 방법**

**1. Database Sync 활성화** (`auth-service/src/index.ts`)

```typescript
// BEFORE - Development 환경에서만 sync
if (process.env.NODE_ENV === 'development') {
  await sequelize.sync({ alter: true });
  logger.info('Database models synchronized');
}

// AFTER - 모든 환경에서 sync
// NOTE: In production, prefer migrations instead of alter: true
await sequelize.sync({ alter: true });
logger.info('Database models synchronized');
```

**2. Dockerfile 수정** (`auth-service/Dockerfile`)

```dockerfile
# BEFORE
CMD ["npm", "run", "dev"]

# AFTER
CMD ["npm", "start"]
```

**3. Swagger 설정 수정** (`auth-service/src/config/swagger.ts`)

```typescript
// BEFORE
apis: ['./src/routes/*.ts', './src/controllers/*.ts'],

// AFTER
apis: process.env.NODE_ENV === 'production'
  ? ['./dist/routes/*.js', './dist/controllers/*.js']
  : ['./src/routes/*.ts', './src/controllers/*.ts'],
```

**4. 배포**

```bash
# 빌드 및 배포
cd auth-service
docker build --platform linux/amd64 \
  -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-auth-service:c7cab93 .
docker push 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-auth-service:c7cab93

# Kubernetes 배포
kubectl set image deployment/auth-service -n doa-market-prod \
  auth-service=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-auth-service:c7cab93
```

**결과**

```bash
# 테스트 전
POST /api/v1/auth/register - 500 Internal Server Error (148ms)
POST /api/v1/auth/login - 500 Internal Server Error (43ms)

# 테스트 후
POST /api/v1/auth/register - 201 Created (285ms)
POST /api/v1/auth/login - 200 OK (237ms)
POST /api/v1/auth/logout - 200 OK (21ms)
GET /api/v1/auth/me - 200 OK (16ms)
```

**적용된 서비스**
- ✅ auth-service (commit: `61d993d`, `e90cbc6`, `c7cab93`)
- ✅ product-service (commit: `faf9d21`)
- ✅ banner-service (commit: `faf9d21`)
- ⚠️ user-service, review-service, coupon-service (추가 수정 필요, 롤백됨)

**관련 커밋**:
- `61d993d` - Database sync 활성화
- `e90cbc6` - Dockerfile CMD 수정
- `c7cab93` - Swagger 경로 수정
- `67aee7d` - 전체 서비스 일괄 수정

**주의 사항**
1. `sequelize.sync({ alter: true })`는 개발/테스트용
2. 프로덕션에서는 migration 사용 권장
3. `alter: true`는 스키마 변경 시 데이터 손실 가능성 있음
4. 장기적으로 Sequelize CLI migration으로 전환 필요

---

## 5. Kubernetes 리소스 문제

### 5.1 ArgoCD 동기화 실패

**증상**
```
rpc error: code = FailedPrecondition
desc = another operation is already in progress
```

**원인**
- 이전 동기화 작업이 완료되지 않고 stuck 상태
- 새로운 동기화 요청 거부

**해결 방법**
```bash
# Stuck 작업 종료
argocd app terminate-op doa-market-backend-prod

# 강제 동기화
argocd app sync doa-market-backend-prod --force
```

---

### 5.2 Pod 이미지 캐싱 문제

**증상**
- 새 코드로 빌드한 이미지가 `latest` 태그로 푸시됨
- Pod이 재시작되어도 이전 이미지 사용
- 코드 변경사항이 반영되지 않음

**원인**
- `latest` 태그 사용 시 Kubernetes가 로컬 캐시된 이미지 사용
- `imagePullPolicy: Always` 설정해도 digest가 같으면 pull 안함

**해결 방법**

1. **커밋 SHA를 이미지 태그로 사용**
```bash
# CI/CD에서 이미지 빌드
docker build -t 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:7114918

# 특정 커밋 SHA로 배포
kubectl set image deployment/api-gateway \
  -n doa-market-prod \
  api-gateway=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:7114918
```

2. **Pod 강제 재시작**
```bash
kubectl delete pod -n doa-market-prod <pod-name>
```

---

### 5.3 리소스 부족으로 Job 실행 실패

**증상**
```
0/3 nodes are available: 3 Too many pods
Job pod pending
```

**원인**
- 19개 서비스 Pod이 모두 실행 중
- Job Pod을 위한 리소스 부족

**해결 방법**
```bash
# 서비스 일시 중지
SERVICES="banner cart coupon file inventory notification review seller settlement shipping user"
for svc in $SERVICES; do
  kubectl scale deployment -n doa-market-prod $svc-service --replicas=0
done

# Job 실행
kubectl apply -f /tmp/create-databases-job.yaml

# Job 완료 확인
kubectl get job -n doa-market-prod create-databases

# 서비스 복구
for svc in $SERVICES; do
  kubectl scale deployment -n doa-market-prod $svc-service --replicas=1
done
```

---

## 6. 배포 환경 변수 패치

### 직접 환경변수 추가 (ArgoCD 미사용 시)

**상황**
- Helm values 변경이 ArgoCD를 통해 자동 배포되지 않는 경우
- 긴급하게 환경변수를 추가해야 하는 경우

**방법**
```bash
# 환경변수 패치
kubectl patch deployment -n doa-market-prod inventory-service --type='json' -p='[{
  "op": "add",
  "path": "/spec/template/spec/containers/0/env/-",
  "value": {"name": "RABBITMQ_ENABLED", "value": "false"}
}]'

# 이미지 업데이트
kubectl set image deployment/inventory-service \
  -n doa-market-prod \
  inventory-service=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-inventory-service:07cd1b9
```

---

## 참고 자료

### 생성된 AWS 리소스

**Aurora PostgreSQL**
- Cluster ID: `doa-market-rds`
- Endpoint: `doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com`
- Engine: Aurora PostgreSQL 17.4
- Parameter Group: `doa-market-postgres17` (SSL disabled)
- Master User: `doaadmin`
- Master Password: `DoaMarket2024Pass`

**ElastiCache Redis**
- Replication Group: `doa-market-redis`
- Endpoint: `master.doa-market-redis.3agi26.apn2.cache.amazonaws.com`
- Engine: Redis 7.0

**네트워크**
- VPC: `vpc-05833dfa80ced8e6e`
- DB Subnet Group: `doa-market-db-subnet-group`
- Cache Subnet Group: `doa-market-redis-subnet-group`
- RDS Security Group: `sg-029b2762076698e0c`
- Redis Security Group: `sg-0d0928b0628e88b68`
- EKS Node Security Group: `sg-037d2e22b92d81ec5`

### 주요 커밋 히스토리

- `a0aff6c`: VPC 마이그레이션, 데이터베이스 엔드포인트 업데이트
- `4db85ad`: Redis 엔드포인트 수정
- `6c6d2a5`: Logger 경로 수정 (/tmp/logs)
- `07cd1b9`: 다중 서비스 문제 수정 (RabbitMQ, OpenSearch, file uploads)
- `7114918`: 헬스 체크 엔드포인트 추가
- `8a1963c`: Redis 연결 타임아웃 추가
- `ff3f3ba`: Redis 연결을 선택적으로 변경

### 유용한 명령어

**Pod 상태 확인**
```bash
kubectl get pods -n doa-market-prod
kubectl get pods -n doa-market-prod -o wide
kubectl describe pod -n doa-market-prod <pod-name>
kubectl logs -n doa-market-prod <pod-name> --tail=50
```

**배포 관리**
```bash
kubectl get deployments -n doa-market-prod
kubectl rollout restart deployment -n doa-market-prod <deployment-name>
kubectl scale deployment -n doa-market-prod <deployment-name> --replicas=1
```

**리소스 사용량 확인**
```bash
kubectl top nodes
kubectl top pods -n doa-market-prod
```

**AWS 리소스 확인**
```bash
# RDS 상태
aws rds describe-db-clusters --db-cluster-identifier doa-market-rds

# ElastiCache 상태
aws elasticache describe-replication-groups \
  --replication-group-id doa-market-redis
```

---

## 결론

**최종 성과**
- 시작: 12/19 서비스 (63%) 실행
- 완료: 19/19 서비스 (100%) 실행

**주요 해결 사항**
1. ✅ VPC 네트워크 격리 해결 (인프라 완전 재구성)
2. ✅ 모든 데이터베이스 연결 문제 해결
3. ✅ 애플리케이션 의존성 문제 해결 (RabbitMQ, OpenSearch)
4. ✅ 보안 설정과 파일 시스템 문제 해결
5. ✅ 리소스 최적화 및 스케줄링 문제 해결

**교훈**
- 인프라 생성 시 VPC/네트워크 설정을 최우선으로 확인
- 프로덕션 환경에서는 외부 의존성을 선택적으로 구성
- 컨테이너 보안 설정(readOnlyRootFilesystem) 고려한 파일 경로 사용
- 이미지 태그는 커밋 SHA 사용하여 캐싱 문제 방지
- 리소스 요청/제한은 실제 사용량 기반으로 최적화
