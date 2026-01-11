# API 명세서 준수 현황 및 추가 작업

본 문서는 제공된 API 명세서와 현재 코드베이스를 비교하여 누락된 기능들을 정리하고 추가 작업 계획을 수립합니다.

## 📋 명세서 대비 누락/부족한 기능

### ✅ 이미 구현된 기능

1. **인증 (Authentication)**
   - ✅ 판매자 인증 (sign-in, sign-up, me)
   - ✅ 관리자 인증 (sign-in, me)
   - ⚠️ 이메일 인증 요청 (`/auth/send-verification`) - 부분 구현 필요

2. **사용자 (User)**
   - ✅ 사용자 관리 (CRUD)
   - ✅ 사용자 통계

3. **상품 (Product)**
   - ✅ 상품 관리 (CRUD)
   - ✅ 상품 이미지 업로드 (기본 구조)

4. **주문 관리 (Order)**
   - ✅ 주문 조회 및 생성
   - ✅ 주문 상태 변경
   - ⚠️ 판매자 주문 관리 엔드포인트 (`/partner/orders`) - 추가 필요

5. **리뷰 (Review)**
   - ✅ 리뷰 관리 (CRUD)
   - ✅ 상품별 리뷰 조회

6. **공지사항 (Notice)**
   - ✅ 공지사항 관리 (user-service, admin-service)
   - ⚠️ 명세서의 엔드포인트 구조와 다름 - 조정 필요

7. **문의 (Inquiry)**
   - ✅ 문의 관리 (user-service, inquiry-service)
   - ⚠️ 명세서의 엔드포인트 구조와 다름 - 조정 필요

8. **카테고리 (Category)**
   - ✅ 카테고리 관리 (product-service)
   - ⚠️ 명세서의 계층 구조 요구사항 확인 필요

### ❌ 완전히 누락된 기능

1. **배너 (Banner)** - 새로 생성 필요
   - GET `/banners`
   - GET `/banners/:id`
   - POST `/banners`
   - PUT `/banners/:id`
   - DELETE `/banners/:id`

2. **FAQ** - 새로 생성 필요
   - GET `/faq`
   - GET `/faq/:id`
   - POST `/faq`
   - PUT `/faq/:id`
   - DELETE `/faq/:id`

3. **가이드 (Guide)** - 새로 생성 필요
   - GET `/guides`
   - GET `/guides/:id`
   - POST `/guides`
   - PUT `/guides/:id`
   - DELETE `/guides/:id`
   - GET `/guides/:guideId/attachments`

4. **약관 (Terms)** - admin-service의 policy를 확장 필요
   - GET `/terms`
   - GET `/terms/latest/:type`
   - POST `/terms`
   - PUT `/terms/:id`

5. **오류 제보 (Error Report)** - 새로 생성 필요
   - GET `/errorReport`
   - GET `/errorReport/:id`
   - POST `/errorReport`
   - PUT `/errorReport/:id`
   - DELETE `/errorReport/:id`
   - GET `/errorReport/status/:status`
   - GET `/errorReport/category/:category`
   - GET `/errorReport/type/:type`
   - GET `/errorReport/seller/:sellerId/:type`
   - POST `/errorReport/:id/answer`
   - GET `/errorReport/:id/attachments`

6. **취소 관리 (Cancellation)** - order-service에 추가 필요
   - GET `/partner/cancellations`
   - GET `/partner/cancellations/counts`
   - PATCH `/partner/cancellations/:orderId/process`

7. **반품 관리 (Return)** - order-service에 추가 필요
   - GET `/partner/returns`
   - GET `/partner/returns/counts`
   - GET `/partner/returns/:returnId`
   - PATCH `/partner/returns/:returnId/process`
   - PATCH `/partner/returns/:returnId/pickup`
   - PATCH `/partner/returns/:returnId/complete`

8. **배송 관리 (Delivery)** - shipping-service에 추가 필요
   - GET `/partner/deliveries`
   - GET `/partner/deliveries/counts`
   - PATCH `/partner/deliveries/:orderId/start`
   - PATCH `/partner/deliveries/:orderId/tracking`

9. **정산 관리 (Settlement)** - settlement-service에 추가 필요
   - GET `/settlements/stats`
   - GET `/settlements/schedule`
   - PUT `/settlements/schedule`
   - POST `/settlements/process`
   - POST `/settlements/complete`
   - POST `/settlements/hold`
   - POST `/settlements/unhold`
   - POST `/settlements/cancel`
   - DELETE `/settlements`
   - GET `/partner/settlements`
   - GET `/partner/settlements/:settlementId`
   - GET `/partner/settlements/products`
   - GET `/partner/settlements/products/:productId`

10. **매출 (Sales)** - stats-service에 추가 필요
    - GET `/sales`
    - GET `/sales/stats`

11. **첨부파일 (Attachments)** - file-service 개선 필요
    - POST `/attachments/upload/:type/:id`
    - POST `/attachments/delete/:type`
    - GET `/attachments/download-url/:key`

## 🔧 추가 작업 계획

### Phase 1: 새 서비스 생성 (우선순위 높음)

1. **배너 서비스 (banner-service)**
   - 포트: 3017
   - 데이터베이스: doa_banners
   - 기능: 배너 CRUD, ownerType별 조회

2. **FAQ 서비스 (faq-service)**
   - 포트: 3018
   - 데이터베이스: doa_faq
   - 기능: FAQ CRUD

3. **가이드 서비스 (guide-service)**
   - 포트: 3019
   - 데이터베이스: doa_guides
   - 기능: 가이드 CRUD, 첨부파일 관리

4. **오류 제보 서비스 (error-report-service)**
   - 포트: 3020
   - 데이터베이스: doa_error_reports
   - 기능: 오류 제보 CRUD, 상태별/카테고리별 조회, 답변 관리

### Phase 2: 기존 서비스 확장

1. **order-service 확장**
   - 판매자 주문 관리 엔드포인트 (`/partner/orders`)
   - 취소 관리 엔드포인트 (`/partner/cancellations`)
   - 반품 관리 엔드포인트 (`/partner/returns`)

2. **shipping-service 확장**
   - 판매자 배송 관리 엔드포인트 (`/partner/deliveries`)

3. **settlement-service 확장**
   - 정산 처리 엔드포인트들
   - 판매자 정산 조회 엔드포인트들

4. **stats-service 확장**
   - 매출 조회 엔드포인트 (`/sales`)

5. **file-service 확장**
   - 타입별 업로드 엔드포인트
   - 다운로드 URL 생성

6. **admin-service 확장**
   - 약관 엔드포인트 (`/terms`)

### Phase 3: API Gateway 라우팅 추가

모든 새로운 엔드포인트를 API Gateway에 추가하여 통합 엔트리 포인트 제공

## 📝 구현 우선순위

### 높음 (Phase 1)
1. 배너 서비스
2. FAQ 서비스
3. 가이드 서비스
4. 오류 제보 서비스

### 중간 (Phase 2)
5. 판매자 주문/취소/반품/배송 관리
6. 정산 관리 확장
7. 매출 조회
8. 첨부파일 개선

### 낮음 (Phase 3)
9. 약관 서비스 확장
10. 이메일 인증 요청

## 🎯 다음 단계

1. 각 서비스의 기본 구조 생성 (Dockerfile, package.json, 기본 라우트)
2. 데이터베이스 모델 정의
3. 컨트롤러 및 서비스 로직 구현
4. API Gateway 라우팅 추가
5. docker-compose.yml 업데이트

