# DOA Market 애플리케이션 설계서

## 문서 정보
- **프로젝트명**: DOA Market (오픈마켓 플랫폼)
- **작성일**: 2026-01-18
- **버전**: 1.0
- **대상**: 개발팀 (Backend, Frontend, Mobile)

---

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [백엔드 마이크로서비스](#3-백엔드-마이크로서비스)
4. [모바일 애플리케이션](#4-모바일-애플리케이션)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [API 설계](#6-api-설계)
7. [유저 플로우](#7-유저-플로우)
8. [보안 및 인증](#8-보안-및-인증)
9. [확장성 및 성능](#9-확장성-및-성능)
10. [개발 가이드](#10-개발-가이드)

---

## 1. 개요

### 1.1 프로젝트 소개

DOA Market은 AWS 클라우드 기반의 풀스택 오픈마켓 플랫폼입니다. 마이크로서비스 아키텍처를 채택하여 19개의 독립적인 백엔드 서비스와 Flutter 기반 모바일 애플리케이션으로 구성되어 있습니다.

**주요 특징:**
- ✅ 19개 마이크로서비스 기반 백엔드
- ✅ Flutter 모바일 앱 (iOS/Android)
- ✅ React 관리자 웹 (admin-web)
- ✅ AWS EKS 기반 Kubernetes 클러스터
- ✅ PostgreSQL + Redis 인프라
- ✅ ArgoCD GitOps 자동 배포
- ✅ 포인트/리워드 시스템
- ✅ 실시간 주문/배송 추적

### 1.2 기술 스택

#### Backend
- **언어**: TypeScript (Node.js 20+)
- **프레임워크**: Express.js
- **ORM**: Sequelize
- **데이터베이스**: PostgreSQL 17.4 (Aurora Serverless)
- **캐시**: Redis (ElastiCache)
- **메시지 큐**: RabbitMQ (선택적)
- **검색**: OpenSearch (선택적)
- **컨테이너**: Docker
- **오케스트레이션**: Kubernetes (EKS 1.34)

#### Mobile App (User)
- **프레임워크**: Flutter 3.0+
- **언어**: Dart
- **상태관리**: Provider
- **HTTP 클라이언트**: http, Dio
- **로컬 저장소**: SharedPreferences
- **결제**: KG Inicis WebView
- **주소검색**: Daum Postal API (kpostal)

#### Frontend (Admin)
- **프레임워크**: React
- **언어**: TypeScript
- **상태관리**: Context API / Redux
- **UI 라이브러리**: Material-UI

#### Infrastructure
- **클라우드**: AWS (Seoul Region)
- **컨테이너 레지스트리**: Amazon ECR
- **로드 밸런서**: Application Load Balancer
- **CI/CD**: GitHub Actions + ArgoCD
- **모니터링**: Prometheus + Grafana (예정)
- **로깅**: CloudWatch Logs / ELK (예정)

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                         외부 클라이언트                            │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │ Flutter 모바일 앱 │   │  React Admin    │   │  Third-party  │  │
│  │  (iOS/Android)  │   │      Web        │   │   Services    │  │
│  └─────────────────┘   └─────────────────┘   └───────────────┘  │
└──────────────┬──────────────────┬───────────────────┬───────────┘
               │                  │                   │
               │                  │                   │
               v                  v                   v
┌──────────────────────────────────────────────────────────────────┐
│                    Internet Gateway                               │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               v
┌──────────────────────────────────────────────────────────────────┐
│            Application Load Balancer (HTTPS/HTTP)                │
│        k8s-doamarke-apigatew-f0b8b750e2.ap-northeast-2...        │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                    Amazon EKS Cluster (doa-market-prod)             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway (3000)                          │  │
│  │         모든 외부 요청의 단일 진입점 및 라우팅                      │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                          │
│                           v                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  마이크로서비스 레이어 (19개)                      │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │ auth-service │  │ user-service │  │product-service│         │  │
│  │ │   (3001)     │  │   (3002)     │  │   (3003)     │         │  │
│  │ └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │ order-service│  │payment-service│  │ cart-service │         │  │
│  │ │   (3004)     │  │   (3005)     │  │   (3006)     │         │  │
│  │ └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │review-service│  │notification- │  │search-service│         │  │
│  │ │   (3007)     │  │  service     │  │   (3009)     │         │  │
│  │ └──────────────┘  │   (3008)     │  └──────────────┘         │  │
│  │                   └──────────────┘                            │  │
│  │                                                                │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │inventory-    │  │seller-service│  │admin-service │         │  │
│  │ │  service     │  │   (3011)     │  │   (3012)     │         │  │
│  │ │   (3010)     │  └──────────────┘  └──────────────┘         │  │
│  │ └──────────────┘                                              │  │
│  │                                                                │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │ file-service │  │banner-service│  │coupon-service│         │  │
│  │ │   (3013)     │  │   (3014)     │  │   (3015)     │         │  │
│  │ └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │shipping-     │  │stats-service │  │settlement-   │         │  │
│  │ │  service     │  │   (3017)     │  │  service     │         │  │
│  │ │   (3016)     │  └──────────────┘  │   (3018)     │         │  │
│  │ └──────────────┘                    └──────────────┘         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Kubernetes 서비스 및 Pod 관리                       │  │
│  │  - ClusterIP 서비스 (내부 통신)                                  │  │
│  │  - Horizontal Pod Autoscaler                                  │  │
│  │  - ConfigMaps & Secrets                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────┬──────────────────┘
                           │                       │
                           v                       v
┌──────────────────────────────────┐   ┌───────────────────────────┐
│   Amazon Aurora PostgreSQL       │   │  Amazon ElastiCache       │
│      (Serverless v2)             │   │     (Redis)               │
│                                  │   │                           │
│  - 19개 독립 데이터베이스          │   │  - 세션 캐시               │
│  - 자동 확장 (ACU)               │   │  - API 응답 캐시           │
│  - Multi-AZ (권장)               │   │  - Rate Limiting          │
│  - 자동 백업 (7일)               │   │  - 장바구니 임시 저장       │
└──────────────────────────────────┘   └───────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     선택적 서비스 (향후 연동)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  RabbitMQ   │  │ OpenSearch  │  │    S3       │              │
│  │  (메시지 큐)  │  │  (검색엔진)   │  │(파일 저장소) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 서비스 간 통신 패턴

#### 동기 통신 (HTTP/REST)
```
Client → ALB → API Gateway → Individual Service
                    ↓
            Rate Limiting
            Authentication
            Logging
            Routing
```

**예시 호출 흐름:**
```
Mobile App → /api/v1/products/123
    ↓
API Gateway (3000)
    ↓ (Proxy to)
Product Service (3003) → PostgreSQL
    ↓
Response → API Gateway → Mobile App
```

#### 비동기 통신 (Event-Driven) - 향후 구현
```
Order Created Event
    ↓
RabbitMQ/EventBridge
    ├─→ Payment Service (결제 처리)
    ├─→ Inventory Service (재고 차감)
    ├─→ Notification Service (주문 알림)
    └─→ Stats Service (통계 업데이트)
```

### 2.3 네트워크 구성

#### VPC 구조
```
VPC: 192.168.0.0/16
├── Public Subnets (3 AZs)
│   ├── ap-northeast-2a: 192.168.32.0/19
│   ├── ap-northeast-2b: 192.168.64.0/19
│   └── ap-northeast-2c: 192.168.0.0/19
│   └─→ ALB, NAT Gateway 배치
│
└── Private Subnets (3 AZs)
    ├── ap-northeast-2a: 192.168.128.0/19
    ├── ap-northeast-2b: 192.168.160.0/19
    └── ap-northeast-2c: 192.168.96.0/19
    └─→ EKS Worker Nodes, RDS, ElastiCache
```

#### 보안 그룹 정책
- **ALB Security Group**: Internet → 80/443 허용
- **EKS Cluster SG**: ALB → Pod IP 허용
- **RDS Security Group**: EKS Nodes → 5432 허용
- **ElastiCache SG**: EKS Nodes → 6379 허용

---

## 3. 백엔드 마이크로서비스

### 3.1 서비스 목록 및 역할

| # | 서비스명 | 포트 | 책임 영역 | 데이터베이스 | Redis |
|---|---------|------|----------|------------|-------|
| 1 | **api-gateway** | 3000 | API 게이트웨이, 라우팅, 인증 검증 | - | ✅ |
| 2 | **auth-service** | 3001 | 회원가입, 로그인, JWT 발급 | doa_auth | ✅ |
| 3 | **user-service** | 3002 | 사용자 프로필, 주소, 포인트, 출석체크 | doa_users | - |
| 4 | **product-service** | 3003 | 상품 관리, 카테고리 | doa_products | - |
| 5 | **order-service** | 3004 | 주문 생성, 주문 관리, 상태 변경 | doa_orders | - |
| 6 | **payment-service** | 3005 | 결제 처리, PG사 연동 | doa_payments | - |
| 7 | **cart-service** | 3006 | 장바구니 관리 | doa_cart | ✅ |
| 8 | **review-service** | 3007 | 리뷰 작성, 평점 관리 | doa_reviews | - |
| 9 | **notification-service** | 3008 | 알림 발송 (푸시, 이메일, SMS) | doa_notifications | - |
| 10 | **search-service** | 3009 | 상품 검색, 자동완성 | - | - |
| 11 | **inventory-service** | 3010 | 재고 관리, 예약/차감 | doa_inventory | ✅ |
| 12 | **seller-service** | 3011 | 판매자 등록, 승인 | doa_sellers | - |
| 13 | **admin-service** | 3012 | 관리자 기능, 공지사항, FAQ | doa_admin | - |
| 14 | **file-service** | 3013 | 파일 업로드/다운로드 | - | - |
| 15 | **banner-service** | 3014 | 배너 관리 | doa_banners | - |
| 16 | **coupon-service** | 3015 | 쿠폰 생성, 발급, 사용 | doa_coupons | ✅ |
| 17 | **shipping-service** | 3016 | 배송 관리, 배송 추적 | doa_shippings | - |
| 18 | **stats-service** | 3017 | 통계, 분석 | - | ✅ |
| 19 | **settlement-service** | 3018 | 정산 관리 | doa_settlements | - |

### 3.2 핵심 서비스 상세 설명

#### 3.2.1 Auth Service (인증/인가)

**책임:**
- 사용자 회원가입 (이메일/비밀번호)
- 로그인 및 JWT 토큰 발급 (Access Token + Refresh Token)
- 토큰 갱신 (Refresh Token 기반)
- 비밀번호 해싱 (bcrypt)
- Rate Limiting (무차별 대입 공격 방지)

**데이터 모델:**
```typescript
User {
  id: UUID
  email: string (unique)
  password: string (bcrypt hashed)
  name: string
  role: enum('admin', 'seller', 'user')
  status: enum('active', 'suspended', 'deleted')
  createdAt: timestamp
  updatedAt: timestamp
}

RefreshToken {
  id: UUID
  userId: UUID (FK)
  token: string (unique)
  expiresAt: timestamp
  createdAt: timestamp
}
```

**API 엔드포인트:**
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃
- `GET /api/v1/auth/me` - 현재 사용자 정보

**보안:**
- bcrypt 비밀번호 해싱 (salt rounds: 10)
- JWT Access Token (유효기간: 1시간)
- JWT Refresh Token (유효기간: 7일)
- Redis 기반 Rate Limiting (로그인 시도: 5회/분)

---

#### 3.2.2 User Service (사용자 관리)

**책임:**
- 사용자 프로필 관리 (이름, 전화번호, 프로필 이미지)
- 배송지 주소 관리 (CRUD)
- 찜 목록 (Wishlist) 관리
- 포인트 관리 (적립, 사용, 만료, 히스토리)
- 일일 출석체크 시스템
- 리뷰 관리 (사용자별)
- 문의 관리 (1:1 문의)

**데이터 모델:**
```typescript
User {
  id: UUID (PK)
  email: string
  name: string
  phone: string?
  profileImage: string?
  role: enum('admin', 'seller', 'user')
  grade: enum('bronze', 'silver', 'gold', 'vip')
  status: enum('active', 'suspended', 'deleted')
  totalPoints: integer (현재 보유 포인트)
  consecutiveCheckins: integer (연속 출석일)
  lastCheckinDate: date?
  createdAt: timestamp
  updatedAt: timestamp
}

Address {
  id: UUID (PK)
  userId: UUID (FK)
  recipientName: string
  phone: string
  zipCode: string
  address: string
  addressDetail: string?
  isDefault: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

Wishlist {
  id: UUID (PK)
  userId: UUID (FK)
  productId: UUID (FK)
  createdAt: timestamp
}

Point {
  id: UUID (PK)
  userId: UUID (FK)
  amount: integer
  type: enum('earn', 'use', 'expire')
  source: enum('daily_checkin', 'purchase', 'review', 'admin', 'refund', 'event')
  orderId: UUID?
  description: string
  balance: integer (거래 후 잔액)
  expiresAt: timestamp? (만료일)
  remainingAmount: integer (FIFO 추적)
  usedAmount: integer
  isExpired: boolean
  relatedPointId: UUID? (환불 시 원본 포인트)
  createdAt: timestamp
}

DailyCheckin {
  id: UUID (PK)
  userId: UUID (FK)
  checkinDate: date
  pointsEarned: integer
  consecutiveDays: integer
  isBonus: boolean
  createdAt: timestamp
}

Review {
  id: UUID (PK)
  userId: UUID (FK)
  productId: UUID (FK)
  orderId: UUID (FK)
  rating: integer (1-5)
  content: text
  imageUrls: string[]
  helpfulCount: integer
  createdAt: timestamp
  updatedAt: timestamp
}

Inquiry {
  id: UUID (PK)
  userId: UUID (FK)
  title: string
  content: text
  category: enum('order', 'product', 'delivery', 'payment', 'etc')
  imageUrls: string[]
  status: enum('pending', 'answered', 'resolved')
  replyContent: text?
  replyAdminName: string?
  repliedAt: timestamp?
  createdAt: timestamp
  updatedAt: timestamp
}
```

**API 엔드포인트:**
```
# 프로필
GET    /api/v1/users/:userId/profile
PUT    /api/v1/users/:userId/profile

# 주소
GET    /api/v1/users/:userId/addresses
POST   /api/v1/users/:userId/addresses
PUT    /api/v1/users/:userId/addresses/:addressId
DELETE /api/v1/users/:userId/addresses/:addressId

# 찜 목록
GET    /api/v1/users/:userId/wishlist
POST   /api/v1/users/:userId/wishlist
DELETE /api/v1/users/:userId/wishlist/:productId

# 포인트
GET    /api/v1/users/:userId/points/summary
GET    /api/v1/users/:userId/points (히스토리)
POST   /api/v1/users/:userId/points/use
POST   /api/v1/users/:userId/points/earn

# 출석체크
POST   /api/v1/users/:userId/checkin
GET    /api/v1/users/:userId/checkin/status
GET    /api/v1/users/:userId/checkin/calendar
GET    /api/v1/users/:userId/checkin/stats

# 리뷰
GET    /api/v1/users/:userId/reviews
POST   /api/v1/users/:userId/reviews
PUT    /api/v1/users/:userId/reviews/:reviewId
DELETE /api/v1/users/:userId/reviews/:reviewId

# 문의
GET    /api/v1/users/:userId/inquiries
POST   /api/v1/users/:userId/inquiries
GET    /api/v1/users/:userId/inquiries/:inquiryId
```

**비즈니스 로직:**

**포인트 시스템:**
- FIFO (First-In-First-Out) 방식으로 포인트 사용
- 포인트 만료 처리 (적립 후 1년)
- 포인트 사용 시 가장 먼저 적립된 포인트부터 차감
- 주문 취소 시 사용된 포인트 환불 (원본 포인트에 복원)

**출석체크 시스템:**
- 매일 1회 출석 가능 (자정 기준)
- 연속 출석 보너스:
  - 7일 연속: 2배 포인트
  - 30일 연속: 특별 보너스
- 출석 중단 시 연속일 초기화

---

#### 3.2.3 Product Service (상품 관리)

**책임:**
- 상품 등록, 수정, 삭제
- 상품 목록 조회 (페이지네이션, 필터링)
- 상품 상세 조회
- 카테고리 관리 (계층 구조)
- 상품 상태 관리 (draft, active, inactive, out_of_stock)

**데이터 모델:**
```typescript
Product {
  id: UUID (PK)
  sellerId: UUID (FK)
  categoryId: UUID (FK)
  name: string
  slug: string (unique, URL-friendly)
  description: text
  price: decimal(10,2)
  originalPrice: decimal(10,2)?
  status: enum('draft', 'active', 'inactive', 'out_of_stock')
  stockQuantity: integer
  thumbnail: text (image URL)
  createdAt: timestamp
  updatedAt: timestamp
}

Category {
  id: UUID (PK)
  name: string
  slug: string (unique)
  parentId: UUID? (FK, self-reference)
  displayOrder: integer
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**API 엔드포인트:**
```
# 상품
GET    /api/v1/products (쿼리: page, limit, category, status, search)
POST   /api/v1/products (판매자/관리자만)
GET    /api/v1/products/:id
PUT    /api/v1/products/:id (판매자/관리자만)
DELETE /api/v1/products/:id (관리자만)

# 카테고리
GET    /api/v1/categories
GET    /api/v1/categories/:id
POST   /api/v1/categories (관리자만)
PUT    /api/v1/categories/:id (관리자만)
DELETE /api/v1/categories/:id (관리자만)
```

---

#### 3.2.4 Order Service (주문 관리)

**책임:**
- 주문 생성 및 주문번호 자동 생성
- 주문 상태 관리 (FSM: Finite State Machine)
- 주문 취소, 반품, 교환 처리
- 주문 히스토리 조회

**데이터 모델:**
```typescript
Order {
  id: UUID (PK)
  orderNumber: string (unique, 예: ORD-20260118-XXXX)
  userId: UUID (FK)
  sellerId: UUID? (FK)
  status: enum('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  totalAmount: decimal(10,2)
  paymentStatus: enum('pending', 'completed', 'failed', 'refunded')
  shippingAddress: JSONB {
    recipientName: string
    phone: string
    zipCode: string
    address: string
    addressDetail: string
  }
  createdAt: timestamp
  updatedAt: timestamp
}

OrderItem {
  id: UUID (PK)
  orderId: UUID (FK)
  productId: UUID (FK)
  productName: string (스냅샷)
  productPrice: decimal(10,2) (스냅샷)
  quantity: integer
  options: JSONB? (선택한 옵션)
  subtotal: decimal(10,2)
  createdAt: timestamp
}
```

**주문 상태 전이 (FSM):**
```
pending (주문 생성)
  ↓ (결제 완료)
confirmed (주문 확인)
  ↓ (판매자 처리)
processing (상품 준비)
  ↓ (배송 시작)
shipped (배송 중)
  ↓ (배송 완료)
delivered (배송 완료)

※ 각 단계에서 cancelled (주문 취소) 가능
```

**API 엔드포인트:**
```
POST   /api/v1/orders
GET    /api/v1/orders/user/:userId
GET    /api/v1/orders/:orderId
PATCH  /api/v1/orders/:orderId/status
POST   /api/v1/orders/:orderId/cancel
POST   /api/v1/orders/:orderId/return
POST   /api/v1/orders/:orderId/exchange
```

---

#### 3.2.5 Payment Service (결제 처리)

**책임:**
- 결제 정보 생성 및 저장
- PG사 연동 (KG Inicis)
- 결제 승인/취소
- 환불 처리
- 결제 내역 조회

**데이터 모델:**
```typescript
Payment {
  id: UUID (PK)
  orderId: UUID (FK)
  userId: UUID (FK)
  amount: decimal(10,2)
  method: enum('card', 'bank_transfer', 'virtual_account', 'mobile', 'point')
  status: enum('pending', 'completed', 'failed', 'cancelled', 'refunded')
  pgProvider: string ('inicis', 'toss', etc.)
  pgTransactionId: string? (PG사 거래번호)
  pgResponse: JSONB? (PG사 응답 전체)
  failureReason: string?
  paidAt: timestamp?
  refundedAt: timestamp?
  createdAt: timestamp
  updatedAt: timestamp
}
```

**결제 프로세스:**
```
1. 주문 생성 (Order Service)
   ↓
2. 결제 정보 생성 (Payment Service)
   ↓
3. 모바일 앱에서 PG사 WebView 호출
   ↓
4. PG사에서 결제 승인/거부
   ↓
5. Callback URL로 결과 수신
   ↓
6. Payment Service에서 결제 상태 업데이트
   ↓
7. Order Service에 이벤트 전달 (주문 상태 업데이트)
```

**API 엔드포인트:**
```
POST   /api/v1/payments/prepare
POST   /api/v1/payments/:paymentId/complete
POST   /api/v1/payments/:paymentId/cancel
POST   /api/v1/payments/:paymentId/refund
GET    /api/v1/payments/:paymentId
GET    /api/v1/payments/order/:orderId
```

---

#### 3.2.6 기타 서비스 개요

**Cart Service:**
- 장바구니 항목 추가/수정/삭제
- 장바구니 조회
- 재고 검증 (Inventory Service 연동)

**Inventory Service:**
- 재고 조회
- 재고 예약 (주문 생성 시)
- 재고 차감 (결제 완료 시)
- 재고 복구 (주문 취소 시)
- 재고 부족 알림

**Notification Service:**
- 푸시 알림 (FCM)
- 이메일 발송 (AWS SES)
- SMS 발송 (AWS SNS)
- 알림 템플릿 관리

**Admin Service:**
- 공지사항 관리
- FAQ 관리
- 정책 문서 관리 (이용약관, 개인정보처리방침)
- 사용자 정지/해제
- 판매자 승인

---

## 4. 모바일 애플리케이션

### 4.1 앱 구조 및 아키텍처

#### 기술 스택
- **프레임워크**: Flutter 3.0+
- **상태관리**: Provider (ChangeNotifierProvider)
- **HTTP 클라이언트**: http 1.1.2, Dio
- **로컬 저장소**: SharedPreferences
- **이미지 캐싱**: cached_network_image
- **국제화**: intl (한국어 지원)

#### 프로젝트 구조
```
user-app/
├── lib/
│   ├── main.dart (진입점)
│   ├── screens/ (33개 화면)
│   │   ├── splash_screen.dart
│   │   ├── login_screen.dart
│   │   ├── signup_screen.dart
│   │   ├── home_screen.dart
│   │   ├── product_detail_screen.dart
│   │   ├── cart_screen.dart
│   │   ├── checkout_screen.dart
│   │   ├── order_history_screen.dart
│   │   └── ... (30개 더)
│   ├── models/ (12개 데이터 모델)
│   │   ├── product.dart
│   │   ├── cart_item.dart
│   │   ├── order.dart
│   │   ├── point.dart
│   │   ├── review.dart
│   │   └── ...
│   ├── services/
│   │   ├── api_service.dart (32,847 lines)
│   │   ├── api_service_factory.dart
│   │   └── mock_api_service.dart
│   ├── providers/ (상태 관리)
│   │   ├── auth_provider.dart
│   │   ├── cart_provider.dart
│   │   ├── product_provider.dart
│   │   └── ...
│   ├── widgets/ (재사용 컴포넌트)
│   └── utils/ (유틸리티 함수)
├── assets/
│   ├── images/
│   ├── icons/
│   └── policies/
│       ├── privacy_policy.md
│       └── terms_of_service.md
└── pubspec.yaml
```

### 4.2 주요 화면 및 기능

#### 4.2.1 인증 플로우

**Splash Screen** → **Login Screen** ↔ **Signup Screen**

```dart
// 초기 진입 시 인증 상태 확인
if (hasValidToken) {
  Navigator.pushReplacementNamed('/home');
} else {
  Navigator.pushReplacementNamed('/login');
}
```

**기능:**
- JWT 토큰 자동 로그인
- 데모 계정 빠른 로그인
- 회원가입 후 자동 로그인

---

#### 4.2.2 홈 화면 (Home Screen)

**구성:**
1. **상단 배너**: 프로모션 배너 자동 슬라이드 (4초 간격)
2. **탭 네비게이션**: Home / Categories / My Page
3. **상품 필터**:
   - 전체 상품
   - 타임 딜
   - 베스트
   - 신상품
   - 쿠폰 상품
4. **상품 그리드**: 2열 레이아웃, 무한 스크롤 (페이지네이션)

**상품 카드 구성:**
- 상품 썸네일 이미지
- 상품명
- 가격 (할인가 표시)
- 할인율 (있는 경우)
- 평점 (별점)
- 장바구니 버튼
- 찜하기 버튼 (하트 아이콘)

---

#### 4.2.3 상품 상세 (Product Detail Screen)

**레이아웃:**
```
┌─────────────────────────────────┐
│     상품 이미지 (큰 사이즈)         │
├─────────────────────────────────┤
│ 상품명                            │
│ 가격 (원가/할인가)                 │
│ 평점 ★★★★☆ (4.5) 리뷰 120개     │
│ 재고: 50개 남음                   │
├─────────────────────────────────┤
│ [상세정보] [리뷰] [문의] [배송]    │
├─────────────────────────────────┤
│ (선택된 탭 내용 표시)              │
│                                 │
│ - 상세정보: 상품 설명, 스펙        │
│ - 리뷰: 고객 리뷰 목록             │
│ - 문의: Q&A 게시판                │
│ - 배송: 배송 정책 안내             │
├─────────────────────────────────┤
│ 수량 선택: [－] 1 [＋]            │
│ 옵션 선택: [사이즈/색상 선택]      │
├─────────────────────────────────┤
│ [찜하기]  [장바구니]  [바로구매]   │
└─────────────────────────────────┘
```

**기능:**
- 상품 옵션 선택 (Bottom Sheet)
- 수량 선택 (1 ~ 재고 수량)
- 장바구니 담기
- 바로 구매 (즉시 결제 페이지 이동)
- 찜하기/찜 해제
- 리뷰 작성 (구매 확정 후)
- 문의 작성

---

#### 4.2.4 장바구니 (Cart Screen)

**구성:**
```
┌─────────────────────────────────┐
│ 장바구니 (3개 상품)               │
├─────────────────────────────────┤
│ ☑ [상품1 이미지] 상품명           │
│    옵션: 색상-빨강, 사이즈-M      │
│    [－] 2 [＋]  15,000원  [X]   │
├─────────────────────────────────┤
│ ☑ [상품2 이미지] 상품명           │
│    옵션: 없음                     │
│    [－] 1 [＋]  25,000원  [X]   │
├─────────────────────────────────┤
│ 소계:            40,000원        │
│ 배송비:           3,000원        │
│ 할인:                 0원        │
│ ─────────────────────────────   │
│ 총 결제금액:     43,000원        │
├─────────────────────────────────┤
│      [선택 삭제]  [주문하기]      │
└─────────────────────────────────┘
```

**기능:**
- 상품 선택/해제 (체크박스)
- 수량 변경
- 개별 상품 삭제
- 선택 상품 삭제
- 장바구니 비우기
- 재고 검증
- 주문하기 (선택 상품만)

---

#### 4.2.5 주문/결제 (Checkout → Payment)

**Checkout Screen 프로세스:**
```
1. 주문 상품 확인
   ├─ 상품명, 옵션, 수량, 금액
   └─ 소계 계산

2. 배송지 선택
   ├─ 기본 배송지 자동 선택
   ├─ 저장된 배송지 목록
   └─ 새 배송지 추가 (우편번호 검색)

3. 포인트 사용
   ├─ 현재 보유 포인트 표시
   ├─ 사용할 포인트 입력
   └─ 할인 금액 자동 계산

4. 최종 결제 금액
   ├─ 상품 금액
   ├─ 배송비
   ├─ 포인트 할인 (-)
   └─ 최종 결제 금액

5. [결제하기] 버튼
```

**Payment WebView Screen:**
- KG Inicis PG사 결제창 표시
- 결제 수단 선택 (카드, 계좌이체, 가상계좌, 휴대폰 소액결제)
- 결제 완료 시 콜백 처리
- 주문 완료 페이지 이동

---

#### 4.2.6 주문 관리

**Order History Screen:**
- 주문 목록 (최신순)
- 상태별 필터 (전체, 배송 대기, 배송 중, 배송 완료, 취소)
- 주문 상태 배지 (색상 구분)

**Order Detail Screen:**
```
┌─────────────────────────────────┐
│ 주문번호: ORD-20260118-ABCD      │
│ 주문일: 2026-01-18 14:30         │
│ 상태: [배송 중]                   │
├─────────────────────────────────┤
│ 주문 상품                         │
│ ─────────────────────────────   │
│ [상품1 이미지] 상품명 × 2         │
│                       30,000원   │
├─────────────────────────────────┤
│ 배송 정보                         │
│ ─────────────────────────────   │
│ 받는사람: 홍길동                  │
│ 연락처: 010-1234-5678            │
│ 주소: 서울시 강남구...            │
│ 송장번호: 1234567890             │
├─────────────────────────────────┤
│ 결제 정보                         │
│ ─────────────────────────────   │
│ 상품 금액:      30,000원         │
│ 배송비:          3,000원         │
│ 포인트 할인:    -3,000원         │
│ 최종 결제:      30,000원         │
├─────────────────────────────────┤
│ [주문 취소]  [배송 조회]  [리뷰]  │
└─────────────────────────────────┘
```

**주문 상태별 액션:**
- **결제 대기**: 주문 취소
- **배송 준비**: 주문 취소
- **배송 중**: 배송 조회
- **배송 완료**: 리뷰 작성, 교환/반품 신청

---

#### 4.2.7 포인트 및 출석체크

**Point History Screen:**
- 포인트 거래 내역 (적립/사용/만료)
- 필터: 전체, 적립, 사용, 만료
- 출처별 색상 구분:
  - 출석체크: 파란색
  - 구매: 초록색
  - 리뷰: 주황색
  - 환불: 회색
- 페이지네이션 (20개씩)

**Daily Checkin Screen:**
```
┌─────────────────────────────────┐
│    오늘의 출석체크 ✓              │
│  연속 출석: 7일 (보너스 달성!)    │
├─────────────────────────────────┤
│   이번 달 출석 현황               │
│                                 │
│  일 월 화 수 목 금 토             │
│  1  2  3  4  5  6  7             │
│  ✓  ✓  ✓  ✓  ✓  ✓  ✓  (보너스) │
│  8  9  10 11 12 13 14            │
│  ✓  ✓  ✓  ✓  ✓  ✓  ✓            │
├─────────────────────────────────┤
│ 다음 보너스까지: 23일             │
│ 이번 달 적립: 1,400P             │
│ 총 적립 포인트: 12,500P          │
├─────────────────────────────────┤
│      [출석 체크하기]              │
│  (오늘은 이미 출석했습니다)        │
└─────────────────────────────────┘
```

**출석체크 보너스:**
- 기본: 100P/일
- 7일 연속: 200P (2배)
- 30일 연속: 500P (5배 + 특별 보너스)

---

#### 4.2.8 리뷰 및 문의

**리뷰 작성 프로세스:**
```
주문 상세 → 배송 완료 상태
  ↓
[리뷰 작성] 버튼 클릭
  ↓
별점 선택 (1~5)
  ↓
리뷰 내용 작성
  ↓
사진 첨부 (선택, 최대 5장)
  ↓
[등록] 버튼
  ↓
포인트 적립 (+500P)
```

**문의 프로세스:**
```
상품 상세 → [문의] 탭 → [문의 작성]
  ↓
문의 유형 선택 (상품, 배송, 기타)
  ↓
제목 및 내용 작성
  ↓
사진 첨부 (선택)
  ↓
[등록]
  ↓
내 문의 목록에서 확인
  ↓
관리자 답변 알림
```

---

#### 4.2.9 마이페이지 (My Page)

**구성:**
```
┌─────────────────────────────────┐
│ [프로필 사진]                     │
│ 홍길동님 (VIP)                   │
│ hong@example.com                │
│                  [프로필 수정]    │
├─────────────────────────────────┤
│ 포인트: 12,500P  [내역 보기]     │
│ 출석: 7일 연속   [출석 체크]     │
├─────────────────────────────────┤
│ 주문/배송 현황                    │
│ ┌───┬───┬───┬───┐              │
│ │대기│배송중│완료│취소│            │
│ │ 2 │ 1  │ 15│ 0 │              │
│ └───┴───┴───┴───┘              │
│                  [전체 주문 내역] │
├─────────────────────────────────┤
│ 쇼핑 활동                         │
│ • 찜 목록 (12)                   │
│ • 내 리뷰 (8)                    │
│ • 최근 본 상품 (20)               │
├─────────────────────────────────┤
│ 고객센터                          │
│ • 내 문의 (2)                    │
│ • 공지사항                        │
│ • FAQ                           │
├─────────────────────────────────┤
│ 설정                             │
│ • 배송지 관리                     │
│ • 알림 설정                       │
│ • 다크모드 [토글]                 │
│ • 개인정보처리방침                │
│ • 이용약관                        │
│ • 로그아웃                        │
└─────────────────────────────────┘
```

---

### 4.3 상태 관리 (Provider)

#### Provider 목록

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => ThemeProvider()),
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => CartProvider()),
    ChangeNotifierProvider(create: (_) => ProductProvider()),
    ChangeNotifierProvider(create: (_) => WishlistProvider()),
    ChangeNotifierProvider(create: (_) => CategoryProvider()),
    ChangeNotifierProvider(create: (_) => AddressProvider()),
    ChangeNotifierProvider(create: (_) => OrderProvider()),
    ChangeNotifierProvider(create: (_) => SearchProvider()),
    ChangeNotifierProvider(create: (_) => PointProvider()),
    ChangeNotifierProvider(create: (_) => CheckinProvider()),
    ChangeNotifierProvider(create: (_) => NoticeProvider()),
    ChangeNotifierProvider(create: (_) => ReviewProvider()),
    ChangeNotifierProvider(create: (_) => InquiryProvider()),
  ],
  child: MyApp(),
)
```

#### 주요 Provider 예시

**AuthProvider:**
```dart
class AuthProvider extends ChangeNotifier {
  String? _token;
  User? _currentUser;

  bool get isAuthenticated => _token != null;

  Future<void> login(String email, String password) async {
    final response = await apiService.login(email, password);
    _token = response.accessToken;
    _currentUser = response.user;
    await _saveTokenToLocal();
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    await _clearLocalStorage();
    notifyListeners();
  }
}
```

**CartProvider:**
```dart
class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];

  int get itemCount => _items.length;
  double get totalPrice => _items.fold(0, (sum, item) => sum + item.totalPrice);

  void addItem(Product product, int quantity, Map<String, String>? options) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id &&
                mapsEqual(item.selectedOptions, options)
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity, selectedOptions: options));
    }
    notifyListeners();
  }

  void removeItem(String itemId) {
    _items.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  void updateQuantity(String itemId, int newQuantity) {
    final index = _items.indexWhere((item) => item.id == itemId);
    if (index >= 0) {
      _items[index].quantity = newQuantity;
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
```

---

### 4.4 API 통신 (API Service)

**Base URL 설정:**
```dart
class ApiService {
  static const String baseUrl = 'http://192.168.0.15:3000/api/v1';

  // 또는 서비스별 직접 연결
  static const String authServiceUrl = 'http://192.168.0.15:3001/api/v1';
  static const String userServiceUrl = 'http://192.168.0.15:3002/api/v1';
  // ...
}
```

**인증 헤더 자동 추가:**
```dart
Future<http.Response> _authenticatedRequest(
  String method,
  String endpoint,
  {Map<String, dynamic>? body}
) async {
  final token = await _getTokenFromStorage();

  final headers = {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // HTTP 요청 실행
}
```

**에러 처리:**
```dart
try {
  final response = await apiService.getProducts();
  // 성공 처리
} on NetworkException catch (e) {
  _showSnackBar('네트워크 오류: ${e.message}');
} on AuthException catch (e) {
  _showSnackBar('인증 실패: 다시 로그인해주세요');
  _navigateToLogin();
} on ApiException catch (e) {
  _showSnackBar('오류: ${e.message}');
} catch (e) {
  _showSnackBar('알 수 없는 오류가 발생했습니다');
}
```

---

## 5. 데이터베이스 설계

### 5.1 데이터베이스 목록

각 마이크로서비스는 독립적인 PostgreSQL 데이터베이스를 사용합니다.

| 서비스 | 데이터베이스명 | 주요 테이블 |
|-------|--------------|-----------|
| auth-service | doa_auth | users, refresh_tokens, verification_codes |
| user-service | doa_users | users, addresses, wishlist, points, daily_checkins, reviews, inquiries |
| product-service | doa_products | products, categories |
| order-service | doa_orders | orders, order_items |
| payment-service | doa_payments | payments |
| cart-service | doa_cart | carts, cart_items |
| review-service | doa_reviews | reviews |
| notification-service | doa_notifications | notifications |
| inventory-service | doa_inventory | inventory |
| seller-service | doa_sellers | sellers |
| admin-service | doa_admin | notices, faqs, policies, inquiries |
| banner-service | doa_banners | banners |
| coupon-service | doa_coupons | coupons, user_coupons |
| shipping-service | doa_shippings | shippings, tracking |
| settlement-service | doa_settlements | settlements |

### 5.2 핵심 테이블 스키마

#### users (user-service)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  profile_image TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'seller', 'user')),
  grade VARCHAR(20) DEFAULT 'bronze' CHECK (grade IN ('bronze', 'silver', 'gold', 'vip')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  total_points INTEGER DEFAULT 0 NOT NULL,
  consecutive_checkins INTEGER DEFAULT 0 NOT NULL,
  last_checkin_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### products (product-service)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'out_of_stock')),
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
```

#### orders (order-service)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  seller_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  options JSONB,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

#### points (user-service)
```sql
CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'use', 'expire')),
  source VARCHAR(30) NOT NULL CHECK (source IN ('daily_checkin', 'purchase', 'review', 'admin', 'refund', 'event')),
  order_id UUID,
  description VARCHAR(500) NOT NULL,
  balance INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP,
  remaining_amount INTEGER DEFAULT 0 NOT NULL,
  used_amount INTEGER DEFAULT 0 NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE NOT NULL,
  related_point_id UUID REFERENCES points(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_user ON points(user_id);
CREATE INDEX idx_points_type ON points(type);
CREATE INDEX idx_points_source ON points(source);
CREATE INDEX idx_points_created ON points(created_at DESC);
CREATE INDEX idx_points_expires ON points(expires_at);
CREATE INDEX idx_points_fifo ON points(user_id, type, expires_at, is_expired) WHERE type = 'earn' AND is_expired = FALSE;
```

### 5.3 데이터베이스 연결 정보

**로컬 개발 환경:**
```
Host: localhost
Port: 5432
Username: postgres
Password: postgres
Databases: doa_auth, doa_users, doa_products, ... (19개)
```

**Production (AWS Aurora):**
```
Endpoint: doa-market-rds-instance-1.c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com
Port: 5432
Engine: aurora-postgresql 17.4
Instance Class: db.serverless (자동 확장)
Storage: Serverless (자동 확장, 최대 128 TiB)
Encryption: 활성화
Backup: 자동 (7일 보관)
Multi-AZ: 단일 인스턴스 (권장: Multi-AZ 활성화)
```

---

## 6. API 설계

### 6.1 API 표준 규격

#### 요청 형식
```http
POST /api/v1/orders HTTP/1.1
Host: api.doa-market.com
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "options": {"color": "red", "size": "M"}
    }
  ],
  "shippingAddress": {
    "recipientName": "홍길동",
    "phone": "010-1234-5678",
    "zipCode": "06234",
    "address": "서울시 강남구",
    "addressDetail": "101동 101호"
  },
  "pointsToUse": 5000
}
```

#### 응답 형식 (성공)
```json
{
  "success": true,
  "message": "주문이 성공적으로 생성되었습니다",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20260118-ABCD",
    "userId": "uuid",
    "status": "pending",
    "totalAmount": 45000,
    "paymentStatus": "pending",
    "createdAt": "2026-01-18T14:30:00Z"
  }
}
```

#### 응답 형식 (에러)
```json
{
  "success": false,
  "message": "재고가 부족합니다",
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "details": {
      "productId": "uuid",
      "requested": 10,
      "available": 3
    }
  }
}
```

### 6.2 주요 API 엔드포인트

#### Authentication (auth-service:3001)
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### Users (user-service:3002)
```
GET    /api/v1/users/:userId/profile
PUT    /api/v1/users/:userId/profile
GET    /api/v1/users/:userId/addresses
POST   /api/v1/users/:userId/addresses
PUT    /api/v1/users/:userId/addresses/:addressId
DELETE /api/v1/users/:userId/addresses/:addressId
GET    /api/v1/users/:userId/wishlist
POST   /api/v1/users/:userId/wishlist
DELETE /api/v1/users/:userId/wishlist/:productId
GET    /api/v1/users/:userId/points/summary
GET    /api/v1/users/:userId/points
POST   /api/v1/users/:userId/points/use
POST   /api/v1/users/:userId/points/earn
POST   /api/v1/users/:userId/checkin
GET    /api/v1/users/:userId/checkin/status
GET    /api/v1/users/:userId/checkin/calendar
GET    /api/v1/users/:userId/checkin/stats
GET    /api/v1/users/:userId/reviews
POST   /api/v1/users/:userId/reviews
PUT    /api/v1/users/:userId/reviews/:reviewId
DELETE /api/v1/users/:userId/reviews/:reviewId
GET    /api/v1/users/:userId/inquiries
POST   /api/v1/users/:userId/inquiries
GET    /api/v1/users/:userId/inquiries/:inquiryId
```

#### Products (product-service:3003)
```
GET    /api/v1/products?page=1&limit=20&category=uuid&status=active&search=keyword
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/categories
GET    /api/v1/categories/:id
POST   /api/v1/categories
PUT    /api/v1/categories/:id
DELETE /api/v1/categories/:id
```

#### Orders (order-service:3004)
```
POST   /api/v1/orders
GET    /api/v1/orders/user/:userId?page=1&limit=20&status=all
GET    /api/v1/orders/:orderId
PATCH  /api/v1/orders/:orderId/status
POST   /api/v1/orders/:orderId/cancel
POST   /api/v1/orders/:orderId/return
POST   /api/v1/orders/:orderId/exchange
```

#### Payments (payment-service:3005)
```
POST   /api/v1/payments/prepare
POST   /api/v1/payments/:paymentId/complete
POST   /api/v1/payments/:paymentId/cancel
POST   /api/v1/payments/:paymentId/refund
GET    /api/v1/payments/:paymentId
GET    /api/v1/payments/order/:orderId
```

#### Cart (cart-service:3006)
```
GET    /api/v1/cart/:userId
POST   /api/v1/cart
PATCH  /api/v1/cart/:itemId
DELETE /api/v1/cart/:itemId
DELETE /api/v1/cart/:userId/clear
```

#### Admin (admin-service:3012)
```
GET    /api/v1/notices?page=1&limit=20&category=all&priority=all
GET    /api/v1/notices/:noticeId
POST   /api/v1/notices (관리자만)
PUT    /api/v1/notices/:noticeId (관리자만)
DELETE /api/v1/notices/:noticeId (관리자만)
GET    /api/v1/faqs
GET    /api/v1/faqs/:faqId
GET    /api/v1/policies/:type (privacy_policy, terms_of_service)
```

### 6.3 페이지네이션

**쿼리 파라미터:**
```
?page=1&limit=20
```

**응답 메타데이터:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 98,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 6.4 필터링 및 검색

**상품 검색 예시:**
```
GET /api/v1/products?
  page=1&
  limit=20&
  category=uuid&
  minPrice=10000&
  maxPrice=50000&
  search=키워드&
  sort=price_asc&
  status=active
```

### 6.5 Rate Limiting

**정책:**
- 인증 없는 요청: 100 req/min
- 인증된 요청: 1000 req/min
- 로그인 시도: 5 req/min (실패 시 IP 차단)

**응답 헤더:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1642540800
```

---

## 7. 유저 플로우

### 7.1 신규 사용자 획득 플로우

```
┌─────────────────┐
│   앱 다운로드     │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Splash 화면    │
│  (인증 상태 확인) │
└────────┬────────┘
         ↓
   ┌─────┴─────┐
   │ 토큰 존재? │
   └─────┬─────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ↓         ↓
┌───────┐ ┌───────┐
│ Home  │ │ Login │
└───────┘ └───┬───┘
              ↓
         ┌─────────┐
         │회원가입 링크│
         └────┬────┘
              ↓
         ┌─────────────┐
         │ Signup 화면  │
         ├─────────────┤
         │ 이메일 입력   │
         │ 비밀번호 생성 │
         │ 이름 입력     │
         └────┬────────┘
              ↓
         ┌─────────────┐
         │  회원가입 완료 │
         │  자동 로그인   │
         └────┬────────┘
              ↓
         ┌─────────────┐
         │  Home 화면   │
         └──────────────┘
```

### 7.2 상품 발견 및 구매 플로우

```
┌─────────────────┐
│   Home 화면      │
│ - 배너 슬라이드   │
│ - 상품 그리드     │
│ - 카테고리 필터   │
└────────┬────────┘
         ↓
    사용자 액션
         │
    ┌────┴────┐
    │         │         │
    ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐
│ 카테고리│ │ 검색   │ │ 필터   │
│ 선택   │ │ 입력   │ │ 적용   │
└───┬───┘ └───┬───┘ └───┬───┘
    └─────────┴─────────┘
              ↓
    ┌──────────────────┐
    │  상품 목록 화면    │
    │  (필터링된 결과)   │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │  상품 클릭         │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ 상품 상세 화면     │
    ├──────────────────┤
    │ - 이미지          │
    │ - 상세 정보       │
    │ - 리뷰 (탭)       │
    │ - 문의 (탭)       │
    └────────┬─────────┘
             ↓
    사용자 선택
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
┌─────────┐     ┌─────────┐
│ 장바구니  │     │ 바로구매 │
│  담기     │     │         │
└────┬────┘     └────┬────┘
     │               │
     ↓               │
┌─────────┐          │
│장바구니   │          │
│  화면    │          │
│  (확인)  │          │
└────┬────┘          │
     │               │
     │  [주문하기]    │
     └───────┬───────┘
             ↓
    ┌──────────────────┐
    │  Checkout 화면    │
    ├──────────────────┤
    │ 1. 주문 상품 확인  │
    │ 2. 배송지 선택     │
    │ 3. 포인트 사용     │
    │ 4. 최종 금액 확인  │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │   [결제하기]      │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Payment WebView  │
    │  (KG Inicis)     │
    ├──────────────────┤
    │ - 결제 수단 선택   │
    │ - 결제 정보 입력   │
    │ - 결제 승인        │
    └────────┬─────────┘
             ↓
       결제 결과
             │
    ┌────────┴────────┐
    │                 │
   성공              실패
    │                 │
    ↓                 ↓
┌─────────┐     ┌─────────┐
│주문 완료  │     │ 결제 실패│
│  화면    │     │  화면    │
└────┬────┘     └────┬────┘
     │               │
     ↓               ↓
┌─────────┐     ┌─────────┐
│주문 상세  │     │ 재시도   │
└─────────┘     └─────────┘
```

### 7.3 주문 후 관리 플로우

```
┌─────────────────┐
│   주문 완료       │
└────────┬────────┘
         ↓
┌─────────────────┐
│  주문 확인       │
│ (판매자 검토)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  상품 준비       │
│ (Processing)    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  배송 시작       │
│ (Shipped)       │
│ - 송장번호 생성   │
│ - 배송 추적 가능  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  배송 중         │
│ [배송 조회] 가능  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  배송 완료       │
│ (Delivered)     │
└────────┬────────┘
         ↓
  사용자 액션
         │
    ┌────┴────┐
    │         │         │
    ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐
│구매 확정│ │리뷰 작성│ │교환/반품│
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    ↓         ↓         ↓
포인트    포인트    반품 처리
적립      적립      진행
(2%)      (+500P)
```

### 7.4 포인트 및 리워드 플로우

```
┌─────────────────┐
│  포인트 적립      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │         │         │
    ↓         ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│출석체크│ │구매 확정│ │리뷰 작성│ │이벤트  │
│100P   │ │구매액2%│ │500P   │ │변동   │
└───────┘ └───────┘ └───────┘ └───────┘
         │
         ↓
┌─────────────────┐
│ 포인트 통합       │
│ (User의         │
│ total_points    │
│  업데이트)        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 포인트 사용       │
│ (체크아웃 시)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ FIFO 알고리즘    │
│ 가장 먼저 적립된  │
│ 포인트부터 차감   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 할인 적용         │
│ 최종 결제 금액    │
│  감소            │
└─────────────────┘
```

### 7.5 고객 지원 플로우

```
┌─────────────────┐
│   문의 필요       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │         │
    ↓         ↓         ↓
┌───────┐ ┌───────┐ ┌───────┐
│ FAQ   │ │ 공지사항│ │ 1:1   │
│ 확인   │ │ 확인   │ │ 문의   │
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    ↓         ↓         ↓
  해결?     해결?     문의 작성
    │         │         │
   Yes       Yes        ↓
    ↓         ↓    ┌─────────────┐
  종료       종료   │문의 유형 선택│
                   │- 상품        │
                   │- 배송        │
                   │- 결제        │
                   │- 기타        │
                   └────┬────────┘
                        ↓
                   ┌─────────────┐
                   │제목/내용 작성│
                   │사진 첨부(선택)│
                   └────┬────────┘
                        ↓
                   ┌─────────────┐
                   │  문의 등록    │
                   └────┬────────┘
                        ↓
                   ┌─────────────┐
                   │ 상태: 대기중  │
                   └────┬────────┘
                        ↓
                   관리자 답변
                        ↓
                   ┌─────────────┐
                   │  알림 수신    │
                   │ (푸시/이메일) │
                   └────┬────────┘
                        ↓
                   ┌─────────────┐
                   │  답변 확인    │
                   │ 상태: 답변완료│
                   └──────────────┘
```

---

## 8. 보안 및 인증

### 8.1 인증 메커니즘

#### JWT (JSON Web Token) 기반 인증

**Access Token:**
- 유효기간: 1시간
- Payload: userId, email, role
- 서명 알고리즘: HS256 (HMAC-SHA256)

**Refresh Token:**
- 유효기간: 7일
- DB 저장 (refresh_tokens 테이블)
- 일회용 (사용 후 재발급)

**토큰 갱신 프로세스:**
```
Client: Access Token 만료 감지
  ↓
Client → Server: POST /api/v1/auth/refresh
  Body: { refreshToken: "..." }
  ↓
Server: Refresh Token 검증
  - DB에 존재하는지 확인
  - 만료되지 않았는지 확인
  ↓
Server: 새로운 Access Token 발급
Server: 새로운 Refresh Token 발급 (선택적)
Server: 기존 Refresh Token 무효화
  ↓
Server → Client: { accessToken: "...", refreshToken: "..." }
  ↓
Client: 새 토큰 저장
```

### 8.2 비밀번호 보안

**해싱:**
- 알고리즘: bcrypt
- Salt Rounds: 10
- Rainbow Table 공격 방지

**검증:**
```typescript
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

### 8.3 API 보안

#### 인증 미들웨어
```typescript
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### 권한 검증
```typescript
function requireRole(allowedRoles: string[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// 사용 예시
router.delete('/api/v1/products/:id', authMiddleware, requireRole(['admin']), deleteProduct);
```

### 8.4 Rate Limiting

**Redis 기반 Rate Limiter:**
```typescript
async function rateLimiter(req, res, next) {
  const key = `rate_limit:${req.ip}`;
  const limit = 100; // 100 req/min
  const window = 60; // 1분

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: await redis.ttl(key)
    });
  }

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));

  next();
}
```

### 8.5 데이터 암호화

**전송 중 암호화:**
- HTTPS/TLS 1.3
- Let's Encrypt SSL 인증서
- ALB에서 HTTPS 종료

**저장 데이터 암호화:**
- RDS 스토리지 암호화 (AES-256)
- 민감한 필드 (카드번호 등) 애플리케이션 레벨 암호화

### 8.6 보안 헤더

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### 8.7 입력 검증

```typescript
import { body, validationResult } from 'express-validator';

router.post('/api/v1/orders',
  authMiddleware,
  [
    body('userId').isUUID(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isUUID(),
    body('items.*.quantity').isInt({ min: 1, max: 100 }),
    body('shippingAddress.recipientName').isLength({ min: 2, max: 50 }),
    body('shippingAddress.phone').matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... 주문 처리
  }
);
```

---

## 9. 확장성 및 성능

### 9.1 수평 확장 (Horizontal Scaling)

#### Kubernetes HPA (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### EKS Node Group 오토스케일링
- **Standard Workers**: 2-10 노드 (현재 6)
- **Large Workers**: 2-6 노드 (현재 3)
- **Metrics**: CPU, Memory 사용률 기반

### 9.2 캐싱 전략

#### Redis 캐시 레이어
```typescript
// 상품 상세 캐싱
async function getProduct(productId: string): Promise<Product> {
  const cacheKey = `product:${productId}`;

  // 1. Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. DB에서 조회
  const product = await Product.findByPk(productId);

  // 3. Redis에 저장 (TTL: 1시간)
  await redis.setex(cacheKey, 3600, JSON.stringify(product));

  return product;
}

// 캐시 무효화 (상품 수정 시)
async function updateProduct(productId: string, data: Partial<Product>) {
  await Product.update(data, { where: { id: productId } });
  await redis.del(`product:${productId}`);
}
```

#### 모바일 앱 이미지 캐싱
```dart
CachedNetworkImage(
  imageUrl: product.thumbnail,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
  cacheManager: DefaultCacheManager(),
  maxHeightDiskCache: 1000,
  maxWidthDiskCache: 1000,
)
```

### 9.3 데이터베이스 최적화

#### 인덱싱 전략
```sql
-- 자주 조회되는 필드에 인덱스
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_points_user_type ON points(user_id, type, created_at DESC);

-- 복합 인덱스 (FIFO 포인트 조회)
CREATE INDEX idx_points_fifo ON points(user_id, type, expires_at, is_expired)
  WHERE type = 'earn' AND is_expired = FALSE;
```

#### Connection Pool 설정
```typescript
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    max: 20,      // 최대 연결 수
    min: 5,       // 최소 연결 수
    acquire: 30000, // 연결 획득 타임아웃 (30초)
    idle: 10000,    // 유휴 연결 해제 시간 (10초)
  },
  logging: false, // Production에서는 비활성화
});
```

#### Query 최적화
```typescript
// ❌ N+1 문제 발생
const orders = await Order.findAll();
for (const order of orders) {
  order.items = await OrderItem.findAll({ where: { orderId: order.id } });
}

// ✅ Eager Loading으로 해결
const orders = await Order.findAll({
  include: [
    { model: OrderItem, as: 'items' }
  ]
});
```

### 9.4 페이지네이션

```typescript
async function getProducts(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const { count, rows } = await Product.findAndCountAll({
    where: { status: 'active' },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(count / limit),
      hasPreviousPage: page > 1,
    },
  };
}
```

### 9.5 CDN 및 정적 파일 최적화 (향후)

**CloudFront CDN:**
- 상품 이미지
- 배너 이미지
- 정적 에셋 (CSS, JS)
- Edge Location 캐싱으로 지연 시간 단축

**S3 저장소:**
- 원본 이미지 저장
- Lambda@Edge를 통한 이미지 리사이징

---

## 10. 개발 가이드

### 10.1 로컬 개발 환경 설정

#### Backend 서비스 실행
```bash
# 1. PostgreSQL & Redis 시작
docker-compose up -d postgres redis

# 2. 개별 서비스 실행
cd backend/auth-service
npm install
npm run dev  # http://localhost:3001

# 또는 전체 서비스 Docker Compose 실행
docker-compose up -d
```

#### Mobile App 실행
```bash
cd user-app

# 의존성 설치
flutter pub get

# iOS 시뮬레이터 실행
flutter run -d ios

# Android 에뮬레이터 실행
flutter run -d android

# API Base URL 설정 (lib/services/api_service.dart)
# static const String baseUrl = 'http://localhost:3000/api/v1';
# 또는
# static const String baseUrl = 'http://192.168.0.15:3000/api/v1'; (실제 IP)
```

### 10.2 코딩 컨벤션

#### Backend (TypeScript)
```typescript
// 파일명: kebab-case
// auth.service.ts, user.controller.ts

// 클래스명: PascalCase
class UserService {
  // 메서드명: camelCase
  async createUser(data: CreateUserDto): Promise<User> {
    // ...
  }
}

// 상수: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;

// 인터페이스: PascalCase (I prefix 사용 안 함)
interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}
```

#### Frontend (Dart)
```dart
// 파일명: snake_case
// home_screen.dart, cart_provider.dart

// 클래스명: PascalCase
class HomeScreen extends StatelessWidget {
  // 메서드명: camelCase
  void navigateToProduct(Product product) {
    // ...
  }
}

// 상수: lowerCamelCase
const int maxCartItems = 100;

// private 변수: _prefix
String _accessToken;
```

### 10.3 Git Workflow

#### 브랜치 전략 (Git Flow)
```
main (production)
  ↑
develop (통합 개발)
  ↑
feature/기능명 (기능 개발)
hotfix/버그명 (긴급 수정)
```

#### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 설정, 패키지 매니저 수정

예시:
feat(auth): JWT 토큰 갱신 기능 추가
fix(cart): 장바구니 수량 업데이트 버그 수정
docs(api): 주문 API 문서 업데이트
```

### 10.4 테스트 전략

#### Backend 단위 테스트 (Jest)
```typescript
// auth.service.test.ts
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // 해싱 확인
    });

    it('should throw error if email already exists', async () => {
      await expect(
        authService.register({ email: 'duplicate@example.com', password: 'pass', name: 'User' })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

#### Flutter Widget 테스트
```dart
// home_screen_test.dart
void main() {
  testWidgets('HomeScreen displays product grid', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(),
      ),
    );

    // Product grid가 렌더링되는지 확인
    expect(find.byType(GridView), findsOneWidget);

    // 상품 카드가 표시되는지 확인
    expect(find.byType(ProductCard), findsWidgets);
  });
}
```

### 10.5 배포 프로세스

#### CI/CD 파이프라인 (GitHub Actions + ArgoCD)
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and Push Docker Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/doa-market-auth-service:$IMAGE_TAG ./backend/auth-service
          docker push $ECR_REGISTRY/doa-market-auth-service:$IMAGE_TAG

      - name: Update Helm Chart
        run: |
          cd helm/doa-market-production
          sed -i "s/tag: .*/tag: ${{ github.sha }}/" values.yaml
          git add values.yaml
          git commit -m "Update image tag to ${{ github.sha }}"
          git push
```

**ArgoCD 자동 동기화:**
- Git 리포지토리의 Helm 차트 변경 감지
- Kubernetes 클러스터에 자동 배포
- Rolling Update 전략으로 무중단 배포

---

## 부록

### A. 환경 변수 설정

#### Backend 서비스 (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doa_auth
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# API Gateway
API_GATEWAY_URL=http://localhost:3000

# AWS (Production)
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=doa-market-files
AWS_SES_SENDER_EMAIL=noreply@doa-market.com

# PG (결제)
INICIS_MID=your-merchant-id
INICIS_API_KEY=your-api-key
```

#### Mobile App (환境별 분리)
```dart
// lib/config/env.dart
class Environment {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.0.15:3000/api/v1',
  );

  static const bool isProduction = bool.fromEnvironment('PRODUCTION', defaultValue: false);
}

// 실행 시
// flutter run --dart-define=API_BASE_URL=https://api.doa-market.com/api/v1 --dart-define=PRODUCTION=true
```

### B. 에러 코드 정의

| 코드 | 메시지 | 설명 |
|-----|-------|------|
| AUTH_001 | Invalid credentials | 잘못된 이메일 또는 비밀번호 |
| AUTH_002 | Token expired | JWT 토큰 만료 |
| AUTH_003 | Invalid token | 유효하지 않은 토큰 |
| USER_001 | User not found | 사용자를 찾을 수 없음 |
| USER_002 | Email already exists | 이메일 중복 |
| PROD_001 | Product not found | 상품을 찾을 수 없음 |
| PROD_002 | Insufficient stock | 재고 부족 |
| ORD_001 | Order not found | 주문을 찾을 수 없음 |
| ORD_002 | Cannot cancel order | 주문 취소 불가 (이미 배송 중) |
| PAY_001 | Payment failed | 결제 실패 |
| PAY_002 | Payment already processed | 이미 처리된 결제 |
| POINT_001 | Insufficient points | 포인트 부족 |
| POINT_002 | Invalid point amount | 유효하지 않은 포인트 금액 |

### C. 참고 문서

- [Infrastructure Design](./infrastructure-design.md)
- [Backend README](../README.md)
- [API Specification](../API_SPEC_COMPLIANCE.md)
- [Docker Setup](../DOCKER_SETUP.md)
- [Test Guide](../TEST_GUIDE.md)

---

**문서 버전**: 1.0
**최종 수정일**: 2026-01-18
**작성자**: Development Team
**검토자**: Architecture Team, Product Team

**변경 이력:**
- 2026-01-18: 초안 작성 (전체 아키텍처, 서비스 설계, 유저 플로우)
