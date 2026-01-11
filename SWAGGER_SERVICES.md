# Swagger API 문서 - 전체 서비스 목록

## 🎯 Swagger UI 접속 URL

### 구현 완료 ✅

| 서비스 | 포트 | Swagger URL | 상태 |
|--------|------|-------------|------|
| Auth Service | 3001 | http://localhost:3001/api-docs | ✅ 완료 |
| User Service | 3002 | http://localhost:3002/api-docs | ✅ 완료 |
| Product Service | 3003 | http://localhost:3003/api-docs | ✅ 완료 |
| Order Service | 3004 | http://localhost:3004/api-docs | ✅ 완료 |
| Payment Service | 3005 | http://localhost:3005/api-docs | ✅ 완료 |
| Shipping Service | 3006 | http://localhost:3006/api-docs | ✅ 완료 |

### 향후 추가 예정 📋

| 서비스 | 포트 | Swagger URL | 우선순위 |
|--------|------|-------------|---------|
| Seller Service | 3007 | http://localhost:3007/api-docs | Medium |
| Settlement Service | 3008 | http://localhost:3008/api-docs | Medium |
| Coupon Service | 3009 | http://localhost:3009/api-docs | Low |
| Inventory Service | 3010 | http://localhost:3010/api-docs | High |
| Notification Service | 3011 | http://localhost:3011/api-docs | Low |
| Review Service | 3012 | http://localhost:3012/api-docs | Medium |
| Search Service | 3013 | http://localhost:3013/api-docs | High |
| Admin Service | 3014 | http://localhost:3014/api-docs | Medium |
| File Service | 3015 | http://localhost:3015/api-docs | High |
| Stats Service | 3016 | http://localhost:3016/api-docs | Low |

---

## 🚀 빠른 실행 (로컬)

```bash
# Terminal 1: PostgreSQL & Redis
cd /Users/krystal/workspace/doa-market
docker-compose up -d postgres redis

# Terminal 2: Auth Service
cd backend/auth-service
npm install
npm run dev

# Terminal 3: User Service
cd backend/user-service
npm install
npm run dev

# Terminal 4: Product Service
cd backend/product-service
npm install
npm run dev

# Terminal 5: Order Service
cd backend/order-service
npm install
npm run dev
```

---

## 📖 Swagger 사용법

### 1. API 테스트

1. Swagger URL 접속 (예: http://localhost:3001/api-docs)
2. API 엔드포인트 클릭
3. "Try it out" 버튼 클릭
4. 파라미터/Body 입력
5. "Execute" 버튼 클릭
6. Response 확인

### 2. 인증이 필요한 API 테스트

#### Step 1: 로그인하여 토큰 발급

1. `POST /api/v1/auth/login` 실행
2. Response에서 `accessToken` 복사

#### Step 2: Authorize 설정

1. 페이지 상단 **"Authorize"** 🔓 버튼 클릭
2. Value 입력: `Bearer <토큰>`
3. "Authorize" 버튼 클릭
4. 🔒 잠금 아이콘으로 변경 확인

#### Step 3: 인증 API 테스트

인증이 필요한 API를 자유롭게 테스트할 수 있습니다.

---

## 🔍 각 서비스별 주요 API

### Auth Service (3001)

- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃 🔒
- `GET /api/v1/auth/me` - 현재 사용자 🔒

### User Service (3002)

- `GET /api/v1/users` - 사용자 목록 🔒
- `GET /api/v1/users/:id` - 사용자 상세 🔒
- `PATCH /api/v1/users/:id` - 사용자 수정 🔒
- `DELETE /api/v1/users/:id` - 사용자 삭제 🔒

### Product Service (3003)

- `GET /api/v1/products` - 상품 목록
- `POST /api/v1/products` - 상품 등록 🔒
- `GET /api/v1/products/:id` - 상품 상세
- `PATCH /api/v1/products/:id` - 상품 수정 🔒
- `DELETE /api/v1/products/:id` - 상품 삭제 🔒

### Order Service (3004)

- `GET /api/v1/orders` - 주문 목록 🔒
- `POST /api/v1/orders` - 주문 생성 🔒
- `GET /api/v1/orders/:id` - 주문 상세 🔒
- `PATCH /api/v1/orders/:id/status` - 주문 상태 변경 🔒

### Payment Service (3005)

- `GET /api/v1/payments` - 결제 목록 🔒
- `POST /api/v1/payments` - 결제 요청 🔒
- `GET /api/v1/payments/:id` - 결제 상세 🔒

### Shipping Service (3006)

- `GET /api/v1/shippings` - 배송 목록 🔒
- `POST /api/v1/shippings` - 배송 생성 🔒
- `GET /api/v1/shippings/:id/track` - 배송 추적

🔒 = 인증 필요 (Bearer Token)

---

## 📊 Swagger 구현 현황

- **완료**: 6개 서비스 (Auth, User, Product, Order, Payment, Shipping)
- **전체**: 16개 서비스
- **진행률**: 37.5%

---

## 🛠️ 다음 우선순위

1. **Inventory Service** - 재고 관리 (중요도: 높음)
2. **File Service** - 파일 업로드 (중요도: 높음)
3. **Search Service** - 검색 기능 (중요도: 높음)
4. **Seller Service** - 판매자 관리 (중요도: 중간)
5. **Review Service** - 리뷰 관리 (중요도: 중간)

---

**최종 업데이트**: 2025-12-04  
**버전**: 1.0.0

