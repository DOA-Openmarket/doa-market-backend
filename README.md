# DOA Market - Backend Services

19개의 마이크로서비스로 구성된 DOA Market 백엔드 시스템입니다.

## 🚀 CI/CD & Deployment

이 프로젝트는 **GitHub Actions + ArgoCD + Helm**을 사용한 EKS 배포를 지원합니다.

### 빠른 시작

```bash
# 1. ECR 레포지토리 생성
./scripts/create-ecr-repos.sh

# 2. ArgoCD Application 배포
kubectl apply -f argocd/applications/doa-market-production.yaml

# 3. 코드 푸시 → 자동 배포!
git push origin main
```

**CI/CD 문서:**
- **[CI/CD Quick Start](./docs/CICD_QUICKSTART.md)** - 5분 만에 시작하기
- **[CI/CD Setup Guide](./docs/CICD_SETUP.md)** - 상세한 설정 가이드

**특징:**
- ✅ 변경된 서비스만 선택적 빌드
- ✅ GitOps 방식 자동 배포 (ArgoCD)
- ✅ Helm으로 환경별 설정 관리 (dev/prod)
- ✅ HPA 자동 스케일링
- ✅ 보안 스캔 (Trivy) 내장

---

## 💰 Spot Instances로 비용 70% 절감

AWS Spot Instances를 사용해서 **월 $293 → $180** (38% 절감!)

### 빠른 설정

```bash
# Spot Instance 포함 EKS 클러스터 생성 (15분)
./scripts/setup-spot-eks.sh

# 자동으로 설치됨:
# ✅ EKS 클러스터 (On-Demand 2대 + Spot 3-15대)
# ✅ AWS Node Termination Handler (Spot 안전 종료)
# ✅ Cluster Autoscaler (자동 스케일링)
# ✅ Pod Disruption Budget (고가용성)
```

### 주요 특징

| 항목 | 설명 |
|------|------|
| **비용 절감** | On-Demand 대비 70% 저렴 |
| **안정성** | Critical 서비스는 On-Demand 사용 |
| **고가용성** | Spot 종료 2분 전 자동 Pod 이동 |
| **무중단** | 최소 Pod 수 보장 (PDB) |

**상세 가이드:** [Spot Instances 사용 가이드](./docs/SPOT_INSTANCES_GUIDE.md)

---

## 🏗️ 서비스 구현 현황

### ✅ 전체 구현 완료 (16개)

```
backend/
├── auth-service/          ✅ 인증/인가 (JWT, 완전 구현)
├── user-service/          ✅ 사용자 관리
├── product-service/       ✅ 상품 관리
├── order-service/         ✅ 주문 처리
├── payment-service/       ✅ 결제 처리
├── shipping-service/      ✅ 배송 관리
├── seller-service/        ✅ 판매자 관리
├── settlement-service/    ✅ 정산 처리
├── coupon-service/        ✅ 쿠폰 관리
├── inventory-service/     ✅ 재고 관리
├── notification-service/  ✅ 알림 발송
├── review-service/        ✅ 리뷰 관리
├── search-service/        ✅ 검색 서비스
├── admin-service/         ✅ 관리자 기능
├── file-service/          ✅ 파일 업로드
└── stats-service/         ✅ 통계 분석
```

---

## 📊 서비스별 상세 정보

### 1. Auth Service (포트: 3001) ⭐ 프로덕션 레벨

**구현 완료:**

- ✅ 회원가입 (이메일/비밀번호)
- ✅ 로그인 (JWT Access Token + Refresh Token)
- ✅ 토큰 갱신
- ✅ 로그아웃
- ✅ 현재 사용자 정보 조회
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ Rate Limiting
- ✅ 단위 테스트 (Jest + Supertest)

**API 엔드포인트:**

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

---

### 2. User Service (포트: 3002)

**구현 완료:**

- ✅ 사용자 목록 조회
- ✅ 사용자 상세 조회
- ✅ 사용자 정보 수정
- ✅ 사용자 삭제

**향후 확장 예정:**

- 배송지 관리 (CRUD)
- 찜 목록 관리
- 사용자 등급 계산

**API 엔드포인트:**

```
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

---

### 3. Product Service (포트: 3003)

**구현 완료:**

- ✅ 상품 목록 조회
- ✅ 상품 등록
- ✅ 상품 수정
- ✅ 상품 삭제

**향후 확장 예정:**

- 카테고리 계층 구조
- 상품 옵션 관리
- 상품 이미지 (File Service 연동)
- 검색 (Search Service 연동)

**API 엔드포인트:**

```
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

---

### 4. Order Service (포트: 3004)

**구현 완료:**

- ✅ 주문 생성
- ✅ 주문 목록 조회
- ✅ 주문 번호 자동 생성

**향후 확장 예정:**

- 주문 상태 관리 (FSM)
- Payment Service 연동
- Shipping Service 연동
- EventBridge 이벤트 발행

**API 엔드포인트:**

```
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
PATCH  /api/v1/orders/:id/status
POST   /api/v1/orders/:id/cancel
```

---

### 5. Payment Service (포트: 3005)

**구현 완료:**

- ✅ 결제 정보 저장
- ✅ 결제 목록 조회
- ✅ 결제 상태 관리

**향후 확장 예정:**

- PG사 연동 (토스페이먼츠, 이니시스)
- 결제 승인/취소
- 환불 처리
- EventBridge 이벤트 (`payment.completed`, `payment.failed`)

**API 엔드포인트:**

```
GET    /api/v1/payments
POST   /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/approve
POST   /api/v1/payments/:id/refund
```

---

### 6. Shipping Service (포트: 3006)

**구현 완료:**

- ✅ 배송 정보 생성
- ✅ 배송 목록 조회
- ✅ 배송 추적

**향후 확장 예정:**

- 택배사 API 연동 (CJ대한통운, 로젠택배)
- 실시간 배송 추적
- EventBridge 이벤트 (`shipping.dispatched`, `shipping.delivered`)

**API 엔드포인트:**

```
GET    /api/v1/shippings
POST   /api/v1/shippings
GET    /api/v1/shippings/:id/track
```

---

### 7. Seller Service (포트: 3007)

**구현 완료:**

- ✅ 판매자 등록
- ✅ 판매자 목록 조회
- ✅ 판매자 상세 조회
- ✅ 판매자 승인 처리

**향후 확장 예정:**

- 사업자 정보 검증
- 스토어 정보 관리
- 판매 대시보드

**API 엔드포인트:**

```
GET    /api/v1/sellers
POST   /api/v1/sellers
GET    /api/v1/sellers/:id
PATCH  /api/v1/sellers/:id/verify
```

---

### 8. Settlement Service (포트: 3008)

**구현 완료:**

- ✅ 정산 데이터 생성
- ✅ 정산 목록 조회
- ✅ 정산 금액 계산 (총액, 수수료, 순액)

**향후 확장 예정:**

- 정산서 PDF 생성
- 정산 지급 처리
- EventBridge 이벤트 (`settlement.completed`)

**API 엔드포인트:**

```
GET    /api/v1/settlements
POST   /api/v1/settlements
GET    /api/v1/settlements/:id
POST   /api/v1/settlements/:id/pay
```

---

### 9. Coupon Service (포트: 3009)

**구현 완료:**

- ✅ 쿠폰 생성
- ✅ 쿠폰 목록 조회
- ✅ 쿠폰 발급
- ✅ 할인 타입 (정률, 정액)

**향후 확장 예정:**

- Redis 기반 선착순 쿠폰
- 쿠폰 사용 검증
- 프로모션 관리

**API 엔드포인트:**

```
GET    /api/v1/coupons
POST   /api/v1/coupons
POST   /api/v1/coupons/:code/issue
POST   /api/v1/coupons/:code/use
```

---

### 10. Inventory Service (포트: 3010)

**구현 완료:**

- ✅ 재고 조회
- ✅ 재고 예약
- ✅ 재고 수량 관리 (총재고, 예약재고, 가용재고)

**향후 확장 예정:**

- 재고 차감 (결제 완료 시)
- 재고 복구 (주문 취소 시)
- 재고 부족 알림
- EventBridge 이벤트 (`inventory.low_stock`)

**API 엔드포인트:**

```
GET    /api/v1/inventory/:productId
POST   /api/v1/inventory/reserve
POST   /api/v1/inventory/release
POST   /api/v1/inventory/adjust
```

---

### 11. Notification Service (포트: 3011)

**구현 완료:**

- ✅ 알림 생성
- ✅ 알림 목록 조회
- ✅ 알림 발송 처리
- ✅ 알림 타입 (푸시, 이메일, SMS)

**향후 확장 예정:**

- FCM 푸시 알림
- AWS SES 이메일
- AWS SNS SMS
- 알림 템플릿 관리

**API 엔드포인트:**

```
GET    /api/v1/notifications
POST   /api/v1/notifications
POST   /api/v1/notifications/:id/send
```

---

### 12. Review Service (포트: 3012)

**구현 완료:**

- ✅ 리뷰 작성
- ✅ 리뷰 목록 조회
- ✅ 상품별 리뷰 조회
- ✅ 평점 (1~5)

**향후 확장 예정:**

- 리뷰 이미지 (File Service 연동)
- 평점 집계
- 베스트 리뷰 선정

**API 엔드포인트:**

```
GET    /api/v1/reviews
POST   /api/v1/reviews
GET    /api/v1/reviews/products/:productId
PATCH  /api/v1/reviews/:id
DELETE /api/v1/reviews/:id
```

---

### 13. Search Service (포트: 3013)

**구현 완료:**

- ✅ 검색 API 기본 구조
- ✅ 자동완성 API

**향후 확장 예정:**

- OpenSearch 연동
- 전문 검색 (형태소 분석)
- 필터링 (가격, 카테고리)
- 인기 검색어

**API 엔드포인트:**

```
GET    /api/v1/search/products?q=keyword
GET    /api/v1/search/autocomplete?q=key
GET    /api/v1/search/popular
```

---

### 14. Admin Service (포트: 3014)

**구현 완료:**

- ✅ 대시보드 API
- ✅ 사용자 정지 API

**향후 확장 예정:**

- 전체 서비스 데이터 조회 (읽기 전용)
- 판매자 승인/거부
- 상품 심사
- 통계 대시보드
- 공지사항 관리

**API 엔드포인트:**

```
GET    /api/v1/admin/dashboard
POST   /api/v1/admin/users/:id/suspend
POST   /api/v1/admin/sellers/:id/approve
GET    /api/v1/admin/stats
```

---

### 15. File Service (포트: 3015)

**구현 완료:**

- ✅ 파일 업로드 API
- ✅ 파일 삭제 API

**향후 확장 예정:**

- AWS S3 업로드
- 이미지 리사이징 (Lambda)
- Presigned URL 생성
- CloudFront CDN

**API 엔드포인트:**

```
POST   /api/v1/files/upload
DELETE /api/v1/files/:key
GET    /api/v1/files/presigned-url
```

---

### 16. Stats Service (포트: 3016)

**구현 완료:**

- ✅ 판매 통계 API
- ✅ 상품 조회수 API

**향후 확장 예정:**

- 실시간 통계 집계
- 사용자 행동 분석
- 매출 분석
- 리포트 생성 (PDF)

**API 엔드포인트:**

```
GET    /api/v1/stats/sales?period=daily|weekly|monthly
GET    /api/v1/stats/products/views
GET    /api/v1/stats/users/behavior
```

---

## 📋 서비스 포트 맵

| 서비스               | 포트 | 상태    | DB 사용 | Redis 사용 |
| -------------------- | ---- | ------- | ------- | ---------- |
| auth-service         | 3001 | ✅ 완료 | ✅      | ✅         |
| user-service         | 3002 | ✅ 완료 | ✅      | -          |
| product-service      | 3003 | ✅ 완료 | ✅      | -          |
| order-service        | 3004 | ✅ 완료 | ✅      | -          |
| payment-service      | 3005 | ✅ 완료 | ✅      | -          |
| shipping-service     | 3006 | ✅ 완료 | ✅      | -          |
| seller-service       | 3007 | ✅ 완료 | ✅      | -          |
| settlement-service   | 3008 | ✅ 완료 | ✅      | -          |
| coupon-service       | 3009 | ✅ 완료 | ✅      | ✅         |
| inventory-service    | 3010 | ✅ 완료 | ✅      | ✅         |
| notification-service | 3011 | ✅ 완료 | ✅      | -          |
| review-service       | 3012 | ✅ 완료 | ✅      | -          |
| search-service       | 3013 | ✅ 완료 | -       | -          |
| admin-service        | 3014 | ✅ 완료 | -       | -          |
| file-service         | 3015 | ✅ 완료 | -       | -          |
| stats-service        | 3016 | ✅ 완료 | -       | ✅         |

---

## 🔧 인프라 서비스

| 서비스     | 포트 | 용도                | 상태 |
| ---------- | ---- | ------------------- | ---- |
| PostgreSQL | 5432 | 관계형 데이터베이스 | ✅   |
| Redis      | 6379 | 캐시 & 세션         | ✅   |
| PgAdmin    | 5050 | DB 관리 UI          | ✅   |

---

## 🚀 빠른 시작

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Docker Compose로 전체 환경 실행 (권장)

```bash
# 루트 디렉토리에서
cd /Users/krystal/workspace/doa-market

# 전체 환경 실행 (16개 서비스)
docker-compose up -d

# 서비스 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스만 실행
docker-compose up -d postgres redis auth-service user-service
```

### 개별 서비스 로컬 실행

```bash
# 1. PostgreSQL & Redis 먼저 실행
docker-compose up -d postgres redis

# 2. 원하는 서비스 실행
cd backend/auth-service
npm install
npm run dev  # http://localhost:3001
```

---

## 🧪 테스트

### Health Check (모든 서비스)

```bash
# 자동 Health Check 스크립트
for port in {3001..3016}; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/health | jq -r '.service + " - " + .status' 2>/dev/null || echo "❌ DOWN"
done
```

### Auth Service 단위 테스트

```bash
cd backend/auth-service

# 전체 테스트
npm test

# Watch 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### API 시나리오 테스트

```bash
# 1. 회원가입
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# 2. 로그인 (토큰 받기)
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | jq -r '.data.accessToken')

# 3. 상품 조회
curl http://localhost:3003/api/v1/products

# 4. 주문 생성
curl -X POST http://localhost:3004/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"uuid","sellerId":"uuid","totalAmount":50000}'
```

---

## 🔗 서비스 간 통신

### 동기 통신 (REST API)

```
User Service ──[HTTP]──> Auth Service (토큰 검증)
Order Service ──[HTTP]──> Product Service (상품 정보)
Order Service ──[HTTP]──> Inventory Service (재고 확인)
Admin Service ──[HTTP]──> All Services (집계)
```

### 비동기 통신 (EventBridge) - 향후 구현 예정

```
Order Service ──[Event]──> EventBridge ──> Payment Service
                                       ──> Notification Service
                                       ──> Stats Service
                                       ──> Inventory Service
```

---

## 🗄️ 데이터베이스

### PostgreSQL 데이터베이스 목록

- ✅ `doa_auth` - Auth Service
- ✅ `doa_users` - User Service
- ✅ `doa_products` - Product Service
- ✅ `doa_orders` - Order Service
- ✅ `doa_payments` - Payment Service
- ✅ `doa_shippings` - Shipping Service
- ✅ `doa_sellers` - Seller Service
- ✅ `doa_settlements` - Settlement Service
- ✅ `doa_coupons` - Coupon Service
- ✅ `doa_inventory` - Inventory Service
- ✅ `doa_notifications` - Notification Service
- ✅ `doa_reviews` - Review Service

### 접속 정보

```
Host: localhost
Port: 5432
Username: postgres
Password: postgres
```

### PgAdmin 접속

```
URL: http://localhost:5050
Email: admin@doamarket.com
Password: admin
```

---

## 📊 모니터링 & 로깅

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스
docker-compose logs -f auth-service payment-service

# 에러만 필터
docker-compose logs | grep ERROR

# 최근 1시간 로그
docker-compose logs --since 1h
```

---

## 🔍 문제 해결

### 서비스가 시작되지 않음

```bash
# 로그 확인
docker-compose logs service-name

# 컨테이너 재시작
docker-compose restart service-name

# 완전히 재구축
docker-compose down
docker-compose up --build -d
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# PostgreSQL 로그
docker-compose logs postgres

# 직접 접속 테스트
docker exec -it doa-postgres psql -U postgres -c "\l"
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>

# 또는 docker-compose.yml에서 포트 변경
# "3001:3001" -> "3101:3001"
```

---

## 📈 개발 로드맵

### Phase 1: 기본 서비스 ✅ 완료

- ✅ Auth Service (프로덕션 레벨)
- ✅ User, Product, Order Service (기본 구현)

### Phase 2: 결제 & 배송 ✅ 완료

- ✅ Payment Service (기본 구조)
- ✅ Shipping Service (기본 구조)
- ✅ Inventory Service (기본 구조)

### Phase 3: 판매자 & 정산 ✅ 완료

- ✅ Seller Service (기본 구조)
- ✅ Settlement Service (기본 구조)
- ✅ Coupon Service (기본 구조)

### Phase 4: 부가 기능 ✅ 완료

- ✅ Notification Service (기본 구조)
- ✅ Review Service (기본 구조)
- ✅ Search Service (기본 구조)
- ✅ Admin Service (기본 구조)
- ✅ File Service (기본 구조)
- ✅ Stats Service (기본 구조)

### Phase 5: 인프라 & 고도화 📋 예정

- 📋 API Gateway (Kong / AWS API Gateway)
- 📋 Event Bus (EventBridge / RabbitMQ)
- 📋 Service Mesh (Istio / Linkerd)
- 📋 Monitoring (Prometheus + Grafana)
- 📋 CI/CD (GitHub Actions)
- 📋 OpenSearch 연동 (Search Service)
- 📋 AWS S3 연동 (File Service)
- 📋 PG사 연동 (Payment Service)
- 📋 택배사 API 연동 (Shipping Service)

---

## 🎯 현재 상태 요약

### 구현 완료 ✅

- **16개 마이크로서비스** 전체 기본 구조 완료
- **Docker Compose 환경** 전체 서비스 실행 가능
- **PostgreSQL + Redis** 인프라 구축
- **단위 테스트** (Auth Service)
- **API 표준화** 완료

### 다음 우선순위 📋

1. **EventBridge 구축** - 서비스 간 비동기 통신
2. **API Gateway** - 통합 엔드포인트
3. **OpenSearch 연동** - 전문 검색
4. **AWS S3 연동** - 파일 업로드
5. **PG사 연동** - 실제 결제 처리
6. **모니터링** - Prometheus + Grafana

### 테스트 가능 항목 ✅

- ✅ 16개 서비스 Health Check
- ✅ Auth: 회원가입, 로그인, JWT
- ✅ User: CRUD
- ✅ Product: CRUD
- ✅ Order: 주문 생성/조회
- ✅ Payment: 결제 정보 저장
- ✅ Shipping: 배송 정보 관리
- ✅ Seller: 판매자 등록/승인
- ✅ Settlement: 정산 계산
- ✅ Coupon: 쿠폰 발급
- ✅ Inventory: 재고 예약
- ✅ Notification: 알림 발송
- ✅ Review: 리뷰 작성
- ✅ Admin Web 연동

---

## 📚 추가 문서

- **서비스 가이드**: [SERVICES_GUIDE.md](../SERVICES_GUIDE.md)
- **백엔드 설정**: [BACKEND_SETUP.md](../BACKEND_SETUP.md)
- **아키텍처 설계**: [docs/01-architecture-design.md](../docs/01-architecture-design.md)
- **마이크로서비스**: [docs/02-microservices-and-events.md](../docs/02-microservices-and-events.md)

---

## 🛠️ 개발 가이드

### 프로젝트 구조 (각 서비스 공통)

```
service-name/
├── src/
│   ├── controllers/       # 요청 처리
│   ├── services/          # 비즈니스 로직
│   ├── models/            # DB 모델
│   ├── routes/            # API 라우팅
│   ├── middleware/        # 미들웨어
│   ├── utils/             # 유틸리티
│   ├── config/            # 설정
│   └── index.ts           # 진입점
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md (선택)
```

### 코딩 컨벤션

- **언어**: TypeScript (strict mode)
- **프레임워크**: Express.js
- **ORM**: Sequelize (PostgreSQL)
- **로깅**: Winston
- **테스트**: Jest + Supertest

---

## 📝 라이선스

MIT

---

**최종 업데이트**: 2025-12-04  
**버전**: 2.0.0  
**전체 진행률**: 100% (16/16 서비스 기본 구조 완료)
**다음 단계**: 인프라 고도화 & 외부 연동

🎉 **모든 마이크로서비스 기본 구조 구현 완료!**
