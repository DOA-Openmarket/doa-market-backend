# API 명세서 준수 구현 요약

## ✅ 완료된 작업

### 1. 배너 서비스 (Banner Service) - 새로 생성
- **포트**: 3017
- **데이터베이스**: doa_banners
- **구현된 엔드포인트**:
  - `GET /api/v1/banners` - 배너 목록 조회 (ownerType 필터 지원)
  - `GET /api/v1/banners/:id` - 배너 상세 조회
  - `POST /api/v1/banners` - 배너 생성
  - `PUT /api/v1/banners/:id` - 배너 수정
  - `DELETE /api/v1/banners/:id` - 배너 삭제

### 2. 판매자 주문 관리 (Partner Order Management)
- **서비스**: order-service
- **구현된 엔드포인트**:
  - `GET /api/v1/partner/orders` - 판매자 주문 목록 조회
  - `GET /api/v1/partner/orders/counts` - 주문 상태별 개수 조회
  - `PATCH /api/v1/partner/orders/:orderId/status` - 주문 상태 변경

### 3. 판매자 취소 관리 (Partner Cancellation Management)
- **서비스**: order-service
- **구현된 엔드포인트**:
  - `GET /api/v1/partner/cancellations` - 취소 요청 목록 조회
  - `GET /api/v1/partner/cancellations/counts` - 취소 상태별 개수 조회
  - `PATCH /api/v1/partner/cancellations/:orderId/process` - 취소 요청 처리 (approve/reject)

### 4. 판매자 반품 관리 (Partner Return Management)
- **서비스**: order-service
- **구현된 엔드포인트**:
  - `GET /api/v1/partner/returns` - 반품 요청 목록 조회
  - `GET /api/v1/partner/returns/counts` - 반품 상태별 개수 조회
  - `GET /api/v1/partner/returns/:returnId` - 반품 상세 정보 조회
  - `PATCH /api/v1/partner/returns/:returnId/process` - 반품 요청 처리 (approve/reject)
  - `PATCH /api/v1/partner/returns/:returnId/pickup` - 수거 일정 등록
  - `PATCH /api/v1/partner/returns/:returnId/complete` - 반품 완료 처리

### 5. 판매자 배송 관리 (Partner Delivery Management)
- **서비스**: shipping-service
- **구현된 엔드포인트**:
  - `GET /api/v1/partner/deliveries` - 배송 목록 조회
  - `GET /api/v1/partner/deliveries/counts` - 배송 상태별 개수 조회
  - `PATCH /api/v1/partner/deliveries/:orderId/start` - 배송 시작
  - `PATCH /api/v1/partner/deliveries/:orderId/tracking` - 운송장 번호 업데이트

### 6. 정산 관리 확장 (Settlement Management)
- **서비스**: settlement-service
- **구현된 엔드포인트**:
  - `GET /api/v1/settlements` - 정산 목록 조회 (페이지네이션, 필터링)
  - `GET /api/v1/settlements/:id` - 정산 상세 조회
  - `GET /api/v1/settlements/stats` - 정산 통계 조회
  - `GET /api/v1/settlements/schedule` - 정산 일정 조회
  - `PUT /api/v1/settlements/schedule` - 정산 일정 설정
  - `POST /api/v1/settlements/process` - 정산 처리
  - `POST /api/v1/settlements/complete` - 정산 완료 처리
  - `POST /api/v1/settlements/hold` - 정산 보류
  - `POST /api/v1/settlements/unhold` - 정산 보류 해제
  - `POST /api/v1/settlements/cancel` - 정산 완료 취소
  - `DELETE /api/v1/settlements` - 정산 삭제
  - `GET /api/v1/partner/settlements/:sellerId` - 판매자 정산 목록 조회
  - `GET /api/v1/partner/settlements/:sellerId/:settlementId` - 판매자 정산 상세 조회

### 7. 매출 조회 (Sales)
- **서비스**: stats-service
- **구현된 엔드포인트**:
  - `GET /api/v1/sales` - 매출 데이터 조회 (type, startDate, endDate 파라미터 지원)
  - `GET /api/v1/sales/stats` - 매출 통계 조회

### 8. 첨부파일 서비스 개선 (Attachments)
- **서비스**: file-service
- **구현된 엔드포인트**:
  - `POST /api/v1/attachments/upload/:type/:id` - 타입별 첨부파일 업로드
    - 타입: product, banner, seller, notice, guide, inquiry, error_report, review
  - `POST /api/v1/attachments/delete/:type` - 타입별 첨부파일 삭제
  - `GET /api/v1/attachments/download-url/:key` - 첨부파일 다운로드 URL 조회

### 9. API Gateway 라우팅 추가
- 배너 서비스 라우팅 추가
- 판매자 주문/취소/반품/배송 관리 라우팅 추가
- 판매자 정산 관리 라우팅 추가
- 매출 조회 라우팅 추가
- 첨부파일 서비스 라우팅 추가
- 약관 서비스 라우팅 추가

### 10. Docker Compose 업데이트
- 배너 서비스 추가
- 데이터베이스 초기화 스크립트 업데이트 (doa_banners 추가)
- docker-compose.dev.yml 업데이트

## 📋 남은 작업 (우선순위 낮음)

### 1. FAQ 서비스
- 새 서비스 생성 필요
- 포트: 3018
- 데이터베이스: doa_faq

### 2. 가이드 서비스
- 새 서비스 생성 필요
- 포트: 3019
- 데이터베이스: doa_guides

### 3. 오류 제보 서비스
- 새 서비스 생성 필요
- 포트: 3020
- 데이터베이스: doa_error_reports

### 4. 약관 서비스 확장
- admin-service의 policy를 약관으로 확장
- `/api/v1/terms` 엔드포인트 추가
- `/api/v1/terms/latest/:type` 엔드포인트 추가

## 🚀 사용 방법

### 1. 전체 환경 실행

```bash
cd /Users/krystal/workspace/doa-market/backend
docker-compose up --build -d
```

### 2. 로컬 개발 모드

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 3. 새로운 엔드포인트 테스트

```bash
# 배너 목록 조회
curl http://localhost:3000/api/v1/banners

# 판매자 주문 목록 조회
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/partner/orders?sellerId=<sellerId>

# 정산 목록 조회
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/settlements
```

## 📝 참고사항

1. **인증**: 대부분의 엔드포인트는 JWT 토큰이 필요합니다.
2. **권한**: 판매자 관련 엔드포인트는 `seller` 또는 `admin` 역할이 필요합니다.
3. **데이터베이스**: 새로운 서비스를 추가할 때는 `scripts/init-databases.sql`에 데이터베이스 생성 스크립트를 추가해야 합니다.
4. **API Gateway**: 모든 새로운 엔드포인트는 API Gateway에 라우팅을 추가해야 합니다.

## 🔗 관련 문서

- `API_SPEC_COMPLIANCE.md` - 명세서 준수 현황 상세
- `DOCKER_SETUP.md` - Docker Compose 사용 가이드
- `README.md` - 전체 서비스 개요

