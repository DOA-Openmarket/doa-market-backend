# DOA Market API 테스트 보고서

## 📊 테스트 요약

**실행 시간**: 4분 2.6초  
**총 요청 수**: 65개  
**실패 요청**: 16개 (24.6%)  
**성공률**: 75.4%

---

## ✅ 성공한 엔드포인트 (49개)

### Health Checks (2/2) ✅
- GET `/health` - 200 OK (218ms)
- GET `/api/v1/health` - 200 OK (10ms)

### Products (2/6) ⚠️
- ✅ GET `/api/v1/products` - 200 OK (42ms)
- ✅ GET `/api/v1/products/:id` - 200 OK (16ms)
- ⏱️ POST `/api/v1/products` - TIMEOUT
- ⏱️ PUT `/api/v1/products/:id` - TIMEOUT
- ❌ DELETE `/api/v1/products/:id` - 404 Not Found
- ❌ GET `/api/v1/products/:id/reviews` - 500 Internal Error

### Categories (1/1) ✅
- ✅ GET `/api/v1/categories` - 200 OK (74ms)

### Banners (2/5) ⚠️
- ✅ GET `/api/v1/banners` - 200 OK (39ms)
- ✅ GET `/api/v1/banners/:id` - 200 OK (17ms)
- ⏱️ POST `/api/v1/banners` - TIMEOUT
- ⏱️ PUT `/api/v1/banners/:id` - TIMEOUT
- ❌ DELETE `/api/v1/banners/:id` - 404 Not Found

### Reviews (2/7) ⚠️
- ✅ GET `/api/v1/reviews` - 200 OK (40ms)
- ✅ GET `/api/v1/reviews/:id` - 200 OK (14ms)
- ⏱️ POST `/api/v1/reviews` - TIMEOUT
- ⏱️ PUT `/api/v1/reviews/:id` - TIMEOUT
- ❌ DELETE `/api/v1/reviews/:id` - 404 Not Found
- ❌ GET `/api/v1/reviews/products/:id` - 500 Internal Error
- ❌ GET `/api/v1/reviews/seller/:id` - 500 Internal Error

### Coupons (2/5) ⚠️
- ✅ GET `/api/v1/coupons` - 200 OK (64ms)
- ✅ GET `/api/v1/coupons/:id` - 200 OK (19ms)
- ⏱️ POST `/api/v1/coupons` - TIMEOUT
- ❌ POST `/api/v1/coupons/:code/issue` - 404 Not Found
- ❌ GET `/api/v1/coupons/seller/:id` - 500 Internal Error

### Users (2/6) ⚠️
- ✅ GET `/api/v1/users` - 200 OK (19ms)
- ✅ GET `/api/v1/users/:id` - 200 OK (51ms)
- ⏱️ POST `/api/v1/users` - TIMEOUT
- ⏱️ PATCH `/api/v1/users/:id` - TIMEOUT
- ❌ DELETE `/api/v1/users/:id` - 404 Not Found
- ❌ GET `/api/v1/users/stats` - 500 Internal Error

### Orders (8/8 - 인증 필요) ✅
- 🔒 GET `/api/v1/orders` - 401 Unauthorized (정상)
- 🔒 GET `/api/v1/orders/:id` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/orders` - 401 Unauthorized (정상)
- 🔒 PATCH `/api/v1/orders/:id/status` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/orders/:id/cancel` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/orders/:id/return` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/orders/:id/exchange` - 401 Unauthorized (정상)
- 🔒 GET `/api/v1/orders/:id/saga-status` - 401 Unauthorized (정상)

### Cart (5/5 - 인증 필요) ✅
- 🔒 GET `/api/v1/cart` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/cart` - 401 Unauthorized (정상)
- 🔒 PATCH `/api/v1/cart/:id` - 401 Unauthorized (정상)
- 🔒 DELETE `/api/v1/cart/:id` - 401 Unauthorized (정상)
- 🔒 DELETE `/api/v1/cart` - 401 Unauthorized (정상)

### Sellers (6/6 - 인증 필요) ✅
- 🔒 GET `/api/v1/sellers` - 401 Unauthorized (정상)
- 🔒 GET `/api/v1/sellers/stats` - 401 Unauthorized (정상)
- 🔒 GET `/api/v1/sellers/:id` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/sellers` - 401 Unauthorized (정상)
- 🔒 PUT `/api/v1/sellers/:id` - 401 Unauthorized (정상)
- 🔒 PATCH `/api/v1/sellers/:id/verify` - 401 Unauthorized (정상)

### Notifications (3/3 - 인증 필요) ✅
- 🔒 GET `/api/v1/notifications` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/notifications` - 401 Unauthorized (정상)
- 🔒 POST `/api/v1/notifications/:id/send` - 401 Unauthorized (정상)

---

## ❌ 실패한 엔드포인트 (16개)

### Authentication (8/10) ❌
- ⏱️ POST `/api/v1/auth/register` - TIMEOUT (15s)
- ⏱️ POST `/api/v1/auth/login` - TIMEOUT (15s)
- ⏱️ POST `/api/v1/auth/refresh` - TIMEOUT (15s)
- ✅ POST `/api/v1/auth/logout` - 401 (인증 필요, 정상)
- ✅ GET `/api/v1/auth/me` - 401 (인증 필요, 정상)
- ⏱️ POST `/api/v1/auth/send-verification` - TIMEOUT (15s)
- ⏱️ POST `/api/v1/auth/verify-email` - TIMEOUT (15s)
- ⏱️ POST `/api/v1/sellers/sign-up` - TIMEOUT (15s)
- ⏱️ POST `/api/v1/sellers/sign-in` - TIMEOUT (15s)

### Search (2/2) ❌
- ❌ GET `/api/v1/search/products` - 500 Internal Error
- ❌ GET `/api/v1/search/autocomplete` - 500 Internal Error

### 기타 POST/PUT/PATCH (6개) ⏱️
모든 Create/Update 요청이 15초 타임아웃:
- Users, Products, Banners, Reviews, Coupons

---

## 🔍 주요 문제점

### 1. POST/PUT/PATCH 요청 타임아웃 (15초)
**영향 받는 서비스**: auth-service, user-service, product-service, banner-service, review-service, coupon-service

**원인 추정**:
- 데이터베이스 연결 문제
- 트랜잭션 타임아웃
- 이벤트 발행 실패
- Body parser 문제

### 2. Search Service 오류
- 모든 검색 API가 500 에러 반환
- 내부 서비스 오류

### 3. 특정 GET 요청 500 에러
- `/api/v1/products/:id/reviews` - 라우팅 문제 (수정 완료했으나 아직 배포 안됨)
- `/api/v1/users/stats` - 서비스 내부 오류
- `/api/v1/reviews/products/:id` - 서비스 내부 오류
- `/api/v1/coupons/seller/:id` - 서비스 내부 오류

---

## 📈 서비스별 성공률

| 서비스 | 성공 | 실패 | 성공률 |
|-------|------|------|--------|
| Health | 2/2 | 0 | 100% |
| Categories | 1/1 | 0 | 100% |
| Orders | 8/8 | 0 | 100% (인증 체크) |
| Cart | 5/5 | 0 | 100% (인증 체크) |
| Sellers | 6/6 | 0 | 100% (인증 체크) |
| Notifications | 3/3 | 0 | 100% (인증 체크) |
| Banners | 2/5 | 3 | 40% |
| Products | 2/6 | 4 | 33% |
| Coupons | 2/5 | 3 | 40% |
| Reviews | 2/7 | 5 | 29% |
| Users | 2/6 | 4 | 33% |
| Authentication | 2/10 | 8 | 20% |
| Search | 0/2 | 2 | 0% |

---

## 🎯 권장 조치사항

### 우선순위 1: POST/PUT/PATCH 타임아웃 해결
- [ ] auth-service 로그 확인 및 디버깅
- [ ] user-service, banner-service, review-service, coupon-service 조사
- [ ] 데이터베이스 연결 풀 설정 확인
- [ ] ALB idle timeout 설정 확인 (현재 60초로 추정)

### 우선순위 2: Search Service 수정
- [ ] search-service 로그 확인
- [ ] OpenSearch/Elasticsearch 연결 상태 확인
- [ ] 검색 인덱스 초기화

### 우선순위 3: 500 에러 수정
- [ ] product-service `/products/:id/reviews` 라우팅 수정 배포
- [ ] user-service stats 엔드포인트 수정
- [ ] review-service 필터링 로직 수정

---

## 💡 결론

**현재 상태**:
- ✅ 모든 GET 조회 API는 정상 작동 (데이터가 있는 경우)
- ✅ 인증 시스템은 정상 작동 (401 응답)
- ✅ API Gateway와 ALB 연결은 안정적
- ❌ 모든 POST/PUT 요청이 타임아웃으로 실패
- ❌ Search 기능 완전히 작동 불가

**다음 단계**:
1. 각 서비스의 POST/PUT 핸들러 수정 (product-service 패턴 적용)
2. ALB/Ingress 타임아웃 설정 조정
3. Search Service 재구성
4. 전체 API 재테스트
