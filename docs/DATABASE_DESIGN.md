# DOA Market 데이터베이스 설계 문서

## 개요

DOA Market은 마이크로서비스 아키텍처를 기반으로 한 이커머스 플랫폼입니다. 각 서비스는 독립적인 데이터베이스를 가지며, 서비스 간 통신은 이벤트 기반으로 이루어집니다.

## 데이터베이스 구조

### 데이터베이스명
- `doamarket` (통합 데이터베이스)

---

## 1. 사용자 관리 (User & Auth Service)

### 1.1 users (사용자)
사용자 기본 정보 및 인증 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 사용자 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| phone_number | VARCHAR(20) | UNIQUE | 전화번호 |
| password | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 이름 |
| role | ENUM | NOT NULL, DEFAULT 'customer' | 역할 (customer, seller, admin) |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 상태 (active, inactive, suspended, pending) |
| email_verified | BOOLEAN | DEFAULT false | 이메일 인증 여부 |
| phone_verified | BOOLEAN | DEFAULT false | 전화번호 인증 여부 |
| last_login_at | TIMESTAMP | | 마지막 로그인 시간 |
| last_login_ip | VARCHAR(45) | | 마지막 로그인 IP |
| failed_login_attempts | INTEGER | DEFAULT 0 | 로그인 실패 횟수 |
| locked_until | TIMESTAMP | | 계정 잠금 해제 시간 |
| metadata | JSONB | | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| deleted_at | TIMESTAMP | | 삭제일시 (Soft Delete) |

**인덱스:**
- idx_users_email: email
- idx_users_phone: phone_number
- idx_users_role: role
- idx_users_status: status

### 1.2 refresh_tokens (리프레시 토큰)
JWT 리프레시 토큰 관리

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 토큰 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| token | TEXT | UNIQUE, NOT NULL | 리프레시 토큰 |
| expires_at | TIMESTAMP | NOT NULL | 만료 시간 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

---

## 2. 사용자 프로필 (User Service)

### 2.1 user_profiles (사용자 프로필)
사용자 상세 프로필 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| user_id | UUID | PK, FK → users(id) | 사용자 ID |
| display_name | VARCHAR(100) | | 표시 이름 |
| bio | TEXT | | 자기소개 |
| avatar_url | VARCHAR(500) | | 프로필 이미지 URL |
| date_of_birth | DATE | | 생년월일 |
| gender | ENUM | | 성별 (male, female, other, prefer_not_to_say) |
| nationality | VARCHAR(20) | | 국적 |
| occupation | VARCHAR(100) | | 직업 |
| company | VARCHAR(255) | | 회사명 |
| website | VARCHAR(500) | | 웹사이트 |
| address_line1 | VARCHAR(255) | | 주소 1 |
| address_line2 | VARCHAR(255) | | 주소 2 |
| city | VARCHAR(100) | | 도시 |
| state | VARCHAR(100) | | 주/도 |
| postal_code | VARCHAR(20) | | 우편번호 |
| country | VARCHAR(100) | | 국가 |
| shipping_address_line1 | VARCHAR(255) | | 배송지 주소 1 |
| shipping_address_line2 | VARCHAR(255) | | 배송지 주소 2 |
| shipping_city | VARCHAR(100) | | 배송지 도시 |
| shipping_state | VARCHAR(100) | | 배송지 주/도 |
| shipping_postal_code | VARCHAR(20) | | 배송지 우편번호 |
| shipping_country | VARCHAR(100) | | 배송지 국가 |
| preferences | JSONB | DEFAULT {} | 사용자 설정 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_user_profiles_user_id: user_id (UNIQUE)

### 2.2 user_tiers (사용자 등급)
사용자 멤버십 등급 관리

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 등급 ID |
| user_id | UUID | UNIQUE, FK → users(id) | 사용자 ID |
| tier | ENUM | DEFAULT 'bronze' | 등급 (bronze, silver, gold, platinum, diamond, vip) |
| total_purchase_amount | BIGINT | DEFAULT 0 | 총 구매 금액 |
| total_order_count | INTEGER | DEFAULT 0 | 총 주문 수 |
| total_review_count | INTEGER | DEFAULT 0 | 총 리뷰 수 |
| tier_points | INTEGER | DEFAULT 0 | 등급 포인트 |
| next_tier | ENUM | | 다음 등급 |
| next_tier_progress | INTEGER | DEFAULT 0 | 다음 등급 진행률 (0-100) |
| tier_benefits | JSONB | DEFAULT {} | 등급 혜택 |
| achieved_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 현재 등급 달성 시간 |
| review_period_start | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 등급 심사 기간 시작 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_user_tiers_user_id: user_id (UNIQUE)

### 2.3 tier_history (등급 변경 이력)
사용자 등급 변경 이력

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 이력 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| from_tier | ENUM | NOT NULL | 이전 등급 |
| to_tier | ENUM | NOT NULL | 변경 등급 |
| reason | TEXT | | 변경 사유 |
| purchase_amount_at_change | BIGINT | DEFAULT 0 | 변경 시점 구매 금액 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_tier_history_user_id: user_id
- idx_tier_history_created_at: created_at

### 2.4 user_activity (사용자 활동)
사용자 활동 로그

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 활동 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| activity_type | VARCHAR(50) | NOT NULL | 활동 유형 |
| description | TEXT | | 활동 설명 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

---

## 3. 판매자 관리 (Seller Service)

### 3.1 sellers (판매자)
판매자 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| seller_id | UUID | PK | 판매자 ID |
| user_id | UUID | UNIQUE, FK → users(id) | 사용자 ID |
| type | ENUM | DEFAULT 'individual' | 유형 (individual, business) |
| business_name | VARCHAR(255) | NOT NULL | 사업자명 |
| business_number | VARCHAR(50) | UNIQUE | 사업자등록번호 |
| representative_name | VARCHAR(100) | | 대표자명 |
| business_address | VARCHAR(500) | | 사업장 주소 |
| business_phone | VARCHAR(20) | | 사업장 전화번호 |
| business_email | VARCHAR(255) | | 사업장 이메일 |
| description | TEXT | | 판매자 소개 |
| logo_url | VARCHAR(500) | | 로고 URL |
| banner_url | VARCHAR(500) | | 배너 URL |
| status | ENUM | DEFAULT 'pending' | 상태 (pending, active, suspended, rejected, inactive) |
| commission_rate | DECIMAL(5,2) | DEFAULT 5.0 | 수수료율 |
| bank_name | VARCHAR(100) | | 은행명 |
| bank_account | VARCHAR(100) | | 계좌번호 |
| account_holder | VARCHAR(100) | | 예금주 |
| total_sales | DECIMAL(15,2) | DEFAULT 0 | 총 매출 |
| total_products | INTEGER | DEFAULT 0 | 총 상품 수 |
| rating_average | DECIMAL(3,2) | DEFAULT 0 | 평균 평점 |
| rating_count | INTEGER | DEFAULT 0 | 평점 개수 |
| approved_at | TIMESTAMP | | 승인일시 |
| approved_by | UUID | FK → users(id) | 승인자 ID |
| rejected_at | TIMESTAMP | | 거부일시 |
| rejected_reason | TEXT | | 거부 사유 |
| settings | JSONB | DEFAULT {} | 판매자 설정 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_sellers_user_id: user_id (UNIQUE)
- idx_sellers_business_number: business_number (UNIQUE, WHERE business_number IS NOT NULL)
- idx_sellers_status: status

---

## 4. 상품 관리 (Product Service)

### 4.1 categories (카테고리)
상품 카테고리 (Tree 구조)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 카테고리 ID |
| name | VARCHAR(100) | NOT NULL | 카테고리명 |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL 슬러그 |
| description | TEXT | | 설명 |
| image_url | VARCHAR(500) | | 이미지 URL |
| display_order | INTEGER | DEFAULT 0 | 표시 순서 |
| is_active | BOOLEAN | DEFAULT true | 활성화 여부 |
| metadata | JSONB | | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| mpath | VARCHAR(255) | | Materialized Path (Tree 구조) |

**Tree 구조:** Materialized Path 방식 사용

### 4.2 products (상품)
상품 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 상품 ID |
| seller_id | UUID | FK → sellers(seller_id) | 판매자 ID |
| category_id | UUID | FK → categories(id) | 카테고리 ID |
| name | VARCHAR(255) | NOT NULL | 상품명 |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL 슬러그 |
| description | TEXT | | 상품 설명 |
| price | DECIMAL(15,2) | NOT NULL | 가격 |
| original_price | DECIMAL(15,2) | | 원가 |
| discount_rate | DECIMAL(5,2) | DEFAULT 0 | 할인율 |
| status | VARCHAR(20) | DEFAULT 'draft' | 상태 (draft, published, sold_out, discontinued) |
| stock_quantity | INTEGER | DEFAULT 0 | 재고 수량 |
| rating_avg | DECIMAL(3,2) | DEFAULT 0 | 평균 평점 |
| review_count | INTEGER | DEFAULT 0 | 리뷰 수 |
| sales_count | INTEGER | DEFAULT 0 | 판매 수 |
| view_count | INTEGER | DEFAULT 0 | 조회 수 |
| metadata | JSONB | | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| deleted_at | TIMESTAMP | | 삭제일시 (Soft Delete) |

**인덱스:**
- idx_products_seller_id: seller_id
- idx_products_category_id: category_id
- idx_products_status: status
- idx_products_created_at: created_at

### 4.3 product_variants (상품 옵션)
상품 변형/옵션 (색상, 사이즈 등)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 옵션 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| sku | VARCHAR(100) | UNIQUE, NOT NULL | SKU 코드 |
| name | VARCHAR(255) | NOT NULL | 옵션명 |
| options | JSONB | NOT NULL | 옵션 (예: {color: "red", size: "L"}) |
| price | DECIMAL(15,2) | NOT NULL | 가격 |
| stock_quantity | INTEGER | DEFAULT 0 | 재고 수량 |
| image_url | VARCHAR(500) | | 이미지 URL |
| is_active | BOOLEAN | DEFAULT true | 활성화 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_product_variants_product_id: product_id
- idx_product_variants_sku: sku

### 4.4 product_images (상품 이미지)
상품 이미지

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 이미지 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| image_url | VARCHAR(500) | NOT NULL | 이미지 URL |
| thumbnail_url | VARCHAR(500) | | 썸네일 URL |
| display_order | INTEGER | DEFAULT 0 | 표시 순서 |
| is_primary | BOOLEAN | DEFAULT false | 대표 이미지 여부 |
| alt_text | VARCHAR(255) | | 대체 텍스트 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_product_images_product_id: product_id

---

## 5. 주문 관리 (Order Service)

### 5.1 orders (주문)
주문 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| order_id | UUID | PK | 주문 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| seller_id | UUID | FK → sellers(seller_id) | 판매자 ID |
| status | ENUM | DEFAULT 'pending' | 주문 상태 |
| payment_status | ENUM | DEFAULT 'pending' | 결제 상태 |
| subtotal | DECIMAL(10,2) | NOT NULL | 소계 |
| shipping_fee | DECIMAL(10,2) | DEFAULT 0 | 배송비 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | 할인 금액 |
| total_amount | DECIMAL(10,2) | NOT NULL | 총 금액 |
| recipient_name | VARCHAR(100) | NOT NULL | 수령인 이름 |
| recipient_phone | VARCHAR(20) | NOT NULL | 수령인 전화번호 |
| shipping_address_line1 | VARCHAR(255) | NOT NULL | 배송지 주소 1 |
| shipping_address_line2 | VARCHAR(255) | | 배송지 주소 2 |
| shipping_city | VARCHAR(100) | NOT NULL | 배송지 도시 |
| shipping_state | VARCHAR(100) | | 배송지 주/도 |
| shipping_postal_code | VARCHAR(20) | NOT NULL | 배송지 우편번호 |
| shipping_country | VARCHAR(2) | DEFAULT 'KR' | 배송지 국가 |
| tracking_number | VARCHAR(100) | | 운송장 번호 |
| courier_company | VARCHAR(100) | | 택배사 |
| shipped_at | TIMESTAMP | | 출고일시 |
| delivered_at | TIMESTAMP | | 배송완료일시 |
| payment_method | VARCHAR(50) | | 결제 수단 |
| payment_transaction_id | VARCHAR(255) | | 결제 트랜잭션 ID |
| paid_at | TIMESTAMP | | 결제일시 |
| order_notes | TEXT | | 주문 메모 |
| cancel_reason | TEXT | | 취소 사유 |
| cancelled_at | TIMESTAMP | | 취소일시 |
| refunded_at | TIMESTAMP | | 환불일시 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_orders_user_id: user_id
- idx_orders_seller_id: seller_id
- idx_orders_status: status
- idx_orders_created_at: created_at

**주문 상태 (status):**
- pending: 대기중
- confirmed: 확인됨
- processing: 처리중
- shipped: 배송중
- delivered: 배송완료
- cancelled: 취소됨
- refunded: 환불됨

**결제 상태 (payment_status):**
- pending: 대기중
- completed: 완료
- failed: 실패
- refunded: 환불됨

### 5.2 order_items (주문 상품)
주문에 포함된 상품 목록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| order_item_id | UUID | PK | 주문 상품 ID |
| order_id | UUID | FK → orders(order_id) | 주문 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| product_name | VARCHAR(255) | NOT NULL | 상품명 (스냅샷) |
| product_image_url | TEXT | | 상품 이미지 URL |
| sku | VARCHAR(100) | | SKU 코드 |
| quantity | INTEGER | NOT NULL | 수량 |
| unit_price | DECIMAL(10,2) | NOT NULL | 단가 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | 할인 금액 |
| total_price | DECIMAL(10,2) | NOT NULL | 총 가격 |
| options | JSONB | DEFAULT {} | 상품 옵션 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_order_items_order_id: order_id
- idx_order_items_product_id: product_id

---

## 6. 결제 관리 (Payment Service)

### 6.1 payments (결제)
결제 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| payment_id | UUID | PK | 결제 ID |
| order_id | UUID | UNIQUE, FK → orders(order_id) | 주문 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| payment_method | ENUM | NOT NULL | 결제 수단 |
| status | ENUM | DEFAULT 'pending' | 결제 상태 |
| amount | DECIMAL(10,2) | NOT NULL | 결제 금액 |
| currency | VARCHAR(3) | DEFAULT 'KRW' | 통화 |
| pg_provider | VARCHAR(50) | | PG사 |
| pg_transaction_id | VARCHAR(255) | | PG 트랜잭션 ID |
| pg_response | JSONB | | PG 응답 |
| card_number | VARCHAR(20) | | 카드번호 (마스킹) |
| card_type | VARCHAR(20) | | 카드 종류 |
| card_issuer | VARCHAR(50) | | 카드 발급사 |
| paid_at | TIMESTAMP | | 결제일시 |
| cancelled_at | TIMESTAMP | | 취소일시 |
| cancel_reason | TEXT | | 취소 사유 |
| refunded_at | TIMESTAMP | | 환불일시 |
| refund_amount | DECIMAL(10,2) | | 환불 금액 |
| refund_reason | TEXT | | 환불 사유 |
| receipt_url | TEXT | | 영수증 URL |
| failure_reason | TEXT | | 실패 사유 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_payments_order_id: order_id
- idx_payments_user_id: user_id
- idx_payments_status: status
- idx_payments_created_at: created_at

**결제 수단 (payment_method):**
- credit_card: 신용카드
- debit_card: 체크카드
- bank_transfer: 계좌이체
- virtual_account: 가상계좌
- mobile_payment: 휴대폰결제
- kakao_pay: 카카오페이
- naver_pay: 네이버페이
- toss_pay: 토스페이

**결제 상태 (status):**
- pending: 대기중
- processing: 처리중
- completed: 완료
- failed: 실패
- cancelled: 취소됨
- refunded: 환불됨
- partial_refunded: 부분환불됨

---

## 7. 배송 관리 (Shipping Service)

### 7.1 shippings (배송)
배송 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| shipping_id | UUID | PK | 배송 ID |
| order_id | UUID | UNIQUE, FK → orders(order_id) | 주문 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| tracking_number | VARCHAR(100) | UNIQUE, NOT NULL | 운송장 번호 |
| carrier | VARCHAR(50) | NOT NULL | 택배사 |
| shipping_method | ENUM | NOT NULL | 배송 방식 |
| status | ENUM | DEFAULT 'pending' | 배송 상태 |
| recipient_name | VARCHAR(100) | NOT NULL | 수령인 이름 |
| recipient_phone | VARCHAR(20) | NOT NULL | 수령인 전화번호 |
| address | TEXT | NOT NULL | 배송지 주소 |
| postal_code | VARCHAR(20) | NOT NULL | 우편번호 |
| city | VARCHAR(100) | NOT NULL | 도시 |
| country | VARCHAR(100) | DEFAULT 'KR' | 국가 |
| shipping_cost | DECIMAL(10,2) | NOT NULL | 배송비 |
| estimated_delivery | TIMESTAMP | | 예상 배송일 |
| actual_delivery | TIMESTAMP | | 실제 배송일 |
| shipped_at | TIMESTAMP | | 출고일시 |
| delivery_notes | TEXT | | 배송 메모 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_shippings_order_id: order_id (UNIQUE)
- idx_shippings_tracking_number: tracking_number
- idx_shippings_status: status

**배송 방식 (shipping_method):**
- standard: 일반배송
- express: 빠른배송
- same_day: 당일배송
- pickup: 직접수령

**배송 상태 (status):**
- pending: 대기중
- preparing: 준비중
- shipped: 출고됨
- in_transit: 배송중
- out_for_delivery: 배송출발
- delivered: 배송완료
- failed: 배송실패
- returned: 반송됨

### 7.2 shipping_addresses (배송지)
사용자 배송지 주소록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 배송지 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| recipient_name | VARCHAR(100) | NOT NULL | 수령인 이름 |
| recipient_phone | VARCHAR(20) | NOT NULL | 수령인 전화번호 |
| postal_code | VARCHAR(10) | NOT NULL | 우편번호 |
| address_line1 | VARCHAR(255) | NOT NULL | 기본 주소 |
| address_line2 | VARCHAR(255) | | 상세 주소 |
| city | VARCHAR(100) | NOT NULL | 시/도 |
| district | VARCHAR(100) | NOT NULL | 시/군/구 |
| neighborhood | VARCHAR(100) | | 동/읍/면 |
| country | VARCHAR(100) | DEFAULT 'Korea' | 국가 |
| is_default | BOOLEAN | DEFAULT false | 기본 배송지 여부 |
| address_type | VARCHAR(20) | | 주소 유형 (home, office 등) |
| address_label | VARCHAR(50) | | 별칭 (집, 회사 등) |
| delivery_request | TEXT | | 배송 요청사항 |
| entrance_password | VARCHAR(50) | | 공동현관 비밀번호 |
| is_verified | BOOLEAN | DEFAULT false | 주소 확인 여부 |
| last_used_at | TIMESTAMP | | 마지막 사용일 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_shipping_addresses_user_id: user_id
- idx_shipping_addresses_is_default: is_default

---

## 8. 장바구니 (Cart Service)

### 8.1 carts (장바구니)
사용자 장바구니

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| cart_id | UUID | PK | 장바구니 ID |
| user_id | UUID | UNIQUE, FK → users(id) | 사용자 ID |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_carts_user_id: user_id (UNIQUE)

### 8.2 cart_items (장바구니 상품)
장바구니에 담긴 상품

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| cart_item_id | UUID | PK | 장바구니 상품 ID |
| cart_id | UUID | FK → carts(cart_id) | 장바구니 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| quantity | INTEGER | NOT NULL | 수량 |
| options | JSONB | DEFAULT {} | 상품 옵션 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_cart_items_cart_id: cart_id
- idx_cart_items_product_id: product_id

---

## 9. 위시리스트 (Wishlist Service)

### 9.1 wishlists (위시리스트)
사용자 찜 목록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| wishlist_id | UUID | PK | 위시리스트 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_wishlists_user_product: (user_id, product_id) UNIQUE
- idx_wishlists_user_id: user_id
- idx_wishlists_product_id: product_id

---

## 10. 리뷰 (Review Service)

### 10.1 reviews (리뷰)
상품 리뷰

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| review_id | UUID | PK | 리뷰 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| order_id | UUID | FK → orders(order_id) | 주문 ID |
| rating | INTEGER | DEFAULT 5 | 평점 (1-5) |
| comment | TEXT | | 리뷰 내용 |
| images | JSON | | 리뷰 이미지 배열 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_reviews_product_id: product_id
- idx_reviews_user_id: user_id

---

## 11. 쿠폰 (Coupon Service)

### 11.1 coupons (쿠폰)
쿠폰 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| coupon_id | UUID | PK | 쿠폰 ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 쿠폰 코드 |
| name | VARCHAR(255) | NOT NULL | 쿠폰명 |
| description | TEXT | | 설명 |
| discount_type | ENUM | NOT NULL | 할인 유형 (percentage, fixed) |
| discount_value | DECIMAL(10,2) | NOT NULL | 할인 값 |
| min_purchase_amount | DECIMAL(10,2) | | 최소 구매 금액 |
| max_discount_amount | DECIMAL(10,2) | | 최대 할인 금액 |
| status | ENUM | DEFAULT 'active' | 상태 (active, expired, disabled) |
| usage_limit | INTEGER | | 사용 제한 횟수 |
| usage_count | INTEGER | DEFAULT 0 | 사용 횟수 |
| per_user_limit | INTEGER | | 사용자당 사용 제한 |
| starts_at | TIMESTAMP | | 시작일시 |
| expires_at | TIMESTAMP | | 만료일시 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_coupons_code: code (UNIQUE)
- idx_coupons_status: status
- idx_coupons_expires_at: expires_at

---

## 12. 포인트 (Point Service)

### 12.1 user_points (사용자 포인트)
사용자별 포인트 잔액

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | ID |
| user_id | UUID | UNIQUE, FK → users(id) | 사용자 ID |
| total_points | INTEGER | DEFAULT 0 | 총 적립 포인트 |
| available_points | INTEGER | DEFAULT 0 | 사용 가능 포인트 |
| used_points | INTEGER | DEFAULT 0 | 사용한 포인트 |
| expired_points | INTEGER | DEFAULT 0 | 만료된 포인트 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_user_points_user_id: user_id (UNIQUE)

### 12.2 point_transactions (포인트 거래)
포인트 적립/사용 내역

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 거래 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| type | ENUM | NOT NULL | 거래 유형 (earned, used, expired, refunded, cancelled) |
| source | ENUM | NOT NULL | 적립 원천 (purchase, review, signup, event, admin, referral, attendance) |
| amount | INTEGER | NOT NULL | 포인트 금액 |
| balance | INTEGER | NOT NULL | 거래 후 잔액 |
| reference_id | VARCHAR(255) | | 참조 ID (주문ID, 리뷰ID 등) |
| description | TEXT | | 설명 |
| expires_at | TIMESTAMP | | 만료일시 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_point_transactions_user_id: user_id
- idx_point_transactions_created_at: created_at
- idx_point_transactions_expires_at: expires_at

---

## 13. 알림 (Notification Service)

### 13.1 notifications (알림)
사용자 알림

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| notification_id | UUID | PK | 알림 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| type | ENUM | NOT NULL | 알림 유형 (order, payment, shipping, review, system) |
| title | VARCHAR(255) | NOT NULL | 제목 |
| message | TEXT | NOT NULL | 메시지 |
| is_read | BOOLEAN | DEFAULT false | 읽음 여부 |
| metadata | JSONB | DEFAULT {} | 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_notifications_user_id: user_id
- idx_notifications_is_read: is_read

---

## 14. 문의 (Inquiry Service)

### 14.1 inquiries (문의)
고객 문의

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 문의 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| type | ENUM | NOT NULL | 문의 유형 (product, order, delivery, payment, refund, account, other) |
| title | VARCHAR(200) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 내용 |
| status | ENUM | DEFAULT 'pending' | 상태 (pending, in_progress, answered, closed) |
| priority | ENUM | DEFAULT 'normal' | 우선순위 (low, normal, high, urgent) |
| order_id | UUID | FK → orders(order_id) | 주문 ID (선택) |
| product_id | UUID | FK → products(id) | 상품 ID (선택) |
| images | JSONB | DEFAULT [] | 첨부 이미지 |
| assigned_to | UUID | FK → users(id) | 담당자 ID |
| answered_at | TIMESTAMP | | 답변일시 |
| closed_at | TIMESTAMP | | 종료일시 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_inquiries_user_id: user_id
- idx_inquiries_status: status
- idx_inquiries_type: type
- idx_inquiries_created_at: created_at

### 14.2 inquiry_responses (문의 응답)
문의에 대한 답변

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 응답 ID |
| inquiry_id | UUID | FK → inquiries(id) | 문의 ID |
| user_id | UUID | FK → users(id) | 작성자 ID |
| is_admin | BOOLEAN | DEFAULT false | 관리자 답변 여부 |
| content | TEXT | NOT NULL | 답변 내용 |
| images | JSONB | DEFAULT [] | 첨부 이미지 |
| is_internal | BOOLEAN | DEFAULT false | 내부 메모 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_inquiry_responses_inquiry_id: inquiry_id
- idx_inquiry_responses_created_at: created_at

---

## 15. 상품 Q&A (Product QnA Service)

### 15.1 product_qna (상품 문의)
상품별 Q&A

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | Q&A ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| seller_id | UUID | FK → sellers(seller_id) | 판매자 ID |
| title | VARCHAR(200) | NOT NULL | 제목 |
| question | TEXT | NOT NULL | 질문 |
| answer | TEXT | | 답변 |
| status | ENUM | DEFAULT 'pending' | 상태 (pending, answered, deleted) |
| is_secret | BOOLEAN | DEFAULT false | 비밀글 여부 |
| answered_at | TIMESTAMP | | 답변일시 |
| answered_by | UUID | FK → users(id) | 답변자 ID |
| helpful_count | INTEGER | DEFAULT 0 | 도움이 됐어요 수 |
| images | JSONB | DEFAULT [] | 질문 이미지 |
| answer_images | JSONB | DEFAULT [] | 답변 이미지 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_product_qna_product_id: product_id
- idx_product_qna_user_id: user_id
- idx_product_qna_seller_id: seller_id
- idx_product_qna_status: status
- idx_product_qna_created_at: created_at
- idx_product_qna_is_secret: is_secret

### 15.2 qna_helpful (Q&A 도움됨)
Q&A 도움됨 기록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | ID |
| qna_id | UUID | FK → product_qna(id) | Q&A ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**인덱스:**
- idx_qna_helpful_unique: (qna_id, user_id) UNIQUE

---

## 16. 최근 본 상품 (Recently Viewed Service)

### 16.1 recently_viewed (최근 본 상품)
사용자별 최근 조회한 상품

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| viewed_at | TIMESTAMP | NOT NULL | 조회일시 |
| view_count | INTEGER | DEFAULT 1 | 조회 횟수 |
| product_name | VARCHAR(255) | | 상품명 (캐시) |
| product_price | INTEGER | | 상품 가격 (캐시) |
| product_image | VARCHAR(500) | | 상품 이미지 (캐시) |
| seller_name | VARCHAR(100) | | 판매자명 (캐시) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

**인덱스:**
- idx_recently_viewed_unique: (user_id, product_id) UNIQUE
- idx_recently_viewed_user_viewed: (user_id, viewed_at)
- idx_recently_viewed_viewed_at: viewed_at

---

## 17. 관리자 로그 (Admin Service)

### 17.1 admin_logs (관리자 활동 로그)
관리자 활동 기록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 로그 ID |
| admin_id | UUID | FK → users(id) | 관리자 ID |
| action | VARCHAR(100) | NOT NULL | 액션 |
| resource_type | VARCHAR(50) | NOT NULL | 리소스 유형 |
| resource_id | VARCHAR(255) | | 리소스 ID |
| details | JSONB | | 상세 정보 |
| ip_address | VARCHAR(45) | | IP 주소 |
| user_agent | TEXT | | User Agent |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

---

## ERD 관계 요약

### 핵심 관계

1. **users → user_profiles** (1:1)
2. **users → user_tiers** (1:1)
3. **users → sellers** (1:1)
4. **users → orders** (1:N)
5. **users → carts** (1:1)
6. **users → wishlists** (1:N)
7. **users → reviews** (1:N)
8. **sellers → products** (1:N)
9. **categories → products** (1:N) + Tree Structure
10. **products → product_variants** (1:N)
11. **products → product_images** (1:N)
12. **orders → order_items** (1:N)
13. **orders → payments** (1:1)
14. **orders → shippings** (1:1)
15. **carts → cart_items** (1:N)
16. **products → reviews** (1:N)
17. **users → point_transactions** (1:N)
18. **users → notifications** (1:N)
19. **products → product_qna** (1:N)

---

## 데이터베이스 설정

### 문자 인코딩
- UTF-8 (utf8mb4)

### 타임존
- UTC

### 백업 정책
- 일일 자동 백업
- 트랜잭션 로그 백업

### 성능 최적화
- 적절한 인덱스 설정
- 파티셔닝 (대용량 테이블)
- 읽기 전용 복제본 운영 고려

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2026-01-21 | 초기 문서 작성 | Claude |
