# ERDCloud Import 가이드

## 개요

이 문서는 DOA Market 프로젝트의 데이터베이스 스키마를 ERDCloud로 import하는 방법을 안내합니다.

## ERDCloud란?

ERDCloud는 웹 기반 ERD(Entity Relationship Diagram) 작성 도구로, 데이터베이스 스키마를 시각적으로 설계하고 관리할 수 있는 서비스입니다.

- 공식 사이트: https://www.erdcloud.com/
- 무료로 사용 가능
- 브라우저에서 바로 사용 가능 (설치 불필요)
- 한글 지원

## Import 방법

### 방법 1: 텍스트 형식으로 Import (권장)

1. **ERDCloud 접속**
   - https://www.erdcloud.com/ 접속
   - 회원가입 또는 로그인

2. **새 프로젝트 생성**
   - 우측 상단 "새 ERD" 버튼 클릭
   - 프로젝트명: "DOA Market Database"

3. **텍스트로 Import**
   - 상단 메뉴에서 "Code" → "Import" 선택
   - 또는 단축키 사용: `Ctrl + Shift + I` (Windows) / `Cmd + Shift + I` (Mac)

4. **Import 파일 선택**
   - `docs/ERDCloud_Import.txt` 파일의 내용을 복사
   - Import 창에 붙여넣기
   - "Import" 버튼 클릭

5. **레이아웃 정리**
   - Import 후 테이블들이 겹쳐있을 수 있음
   - 상단 메뉴에서 "Layout" → "Auto Layout" 선택
   - 자동으로 테이블 배치가 정리됨

### 방법 2: JSON 형식으로 Import

1. **ERDCloud 접속 및 로그인**

2. **Import 메뉴**
   - 상단 메뉴 "File" → "Import from file" 선택

3. **JSON 파일 선택**
   - `docs/ERDCloud_Import.vuerd.json` 파일 선택
   - Import 실행

### 방법 3: SQL DDL로 Import

ERDCloud는 SQL DDL 문도 지원합니다. PostgreSQL DDL을 생성하여 import할 수 있습니다.

1. **TypeORM으로 DDL 생성**
   ```bash
   # 각 서비스 디렉토리에서 실행
   npm run typeorm schema:log > schema.sql
   ```

2. **ERDCloud Import**
   - "Code" → "Import" 선택
   - SQL 형식 선택
   - 생성된 DDL 붙여넣기

## Import 후 작업

### 1. 테이블 그룹화

서비스별로 테이블을 그룹화하면 관리가 편리합니다:

1. **그룹 생성**
   - 여러 테이블 선택 (Shift + Click)
   - 우클릭 → "Group" 선택

2. **권장 그룹**
   - 사용자 관리: `users`, `user_profiles`, `user_tiers`, `tier_history`, `refresh_tokens`
   - 판매자 관리: `sellers`
   - 상품 관리: `categories`, `products`, `product_variants`, `product_images`
   - 주문 관리: `orders`, `order_items`
   - 결제 관리: `payments`
   - 배송 관리: `shippings`, `shipping_addresses`
   - 장바구니: `carts`, `cart_items`
   - 위시리스트: `wishlists`
   - 리뷰: `reviews`
   - 쿠폰: `coupons`
   - 포인트: `user_points`, `point_transactions`
   - 알림: `notifications`
   - 문의: `inquiries`, `inquiry_responses`
   - 상품 Q&A: `product_qna`, `qna_helpful`
   - 최근 본 상품: `recently_viewed`
   - 관리자: `admin_logs`

### 2. 색상 지정

각 그룹에 색상을 지정하여 시각적으로 구분:

1. 테이블 또는 그룹 선택
2. 우클릭 → "Color" 선택
3. 원하는 색상 선택

**권장 색상 구분:**
- 사용자 관련: 파란색 계열
- 상품 관련: 초록색 계열
- 주문/결제 관련: 주황색 계열
- 부가 서비스: 회색 계열

### 3. 메모 추가

중요한 비즈니스 로직이나 제약조건을 메모로 추가:

1. 상단 메뉴 "Insert" → "Memo" 선택
2. 원하는 위치에 클릭
3. 메모 내용 입력

**추가 권장 메모:**
- 사용자 등급 시스템 설명
- 포인트 적립/사용 규칙
- 주문 상태 전환 흐름
- 결제 프로세스 설명

### 4. 관계 확인 및 수정

Import 후 관계(Relationship)가 제대로 설정되었는지 확인:

1. **관계 타입 확인**
   - 1:1 관계: `users` ↔ `user_profiles`
   - 1:N 관계: `products` ↔ `product_images`
   - N:M 관계는 중간 테이블로 표현

2. **외래키 제약조건 확인**
   - ON DELETE CASCADE
   - ON UPDATE CASCADE

3. **관계 추가/수정**
   - 테이블의 컬럼을 다른 테이블로 드래그
   - 또는 우클릭 → "Add Relationship"

## ERDCloud 주요 기능

### 1. 테이블 작성

- **테이블 추가**: 더블클릭 또는 `Ctrl + N`
- **컬럼 추가**: 테이블 선택 후 `Enter`
- **컬럼 삭제**: 컬럼 선택 후 `Delete`

### 2. 관계 설정

- **1:1 관계**: 양쪽 모두 PK 또는 UK
- **1:N 관계**: 한쪽이 PK, 다른 쪽이 FK
- **N:M 관계**: 중간 테이블 생성

### 3. 인덱스 설정

1. 컬럼 선택
2. 우클릭 → "Add Index"
3. 인덱스 타입 선택 (UNIQUE, INDEX, etc.)

### 4. Export 기능

ERDCloud에서 다양한 형식으로 export 가능:

- **이미지**: PNG, SVG
- **코드**: SQL DDL, JPA Entity, C# Model 등
- **문서**: PDF

**Export 방법:**
1. 상단 메뉴 "File" → "Export"
2. 원하는 형식 선택
3. 다운로드

### 5. 협업 기능

- **공유**: 프로젝트 URL 공유
- **실시간 협업**: 여러 사람이 동시에 편집 가능
- **버전 관리**: 변경 이력 확인

## 단축키

| 기능 | Windows/Linux | Mac |
|------|---------------|-----|
| 새 테이블 | Ctrl + N | Cmd + N |
| 테이블 삭제 | Delete | Delete |
| 복사 | Ctrl + C | Cmd + C |
| 붙여넣기 | Ctrl + V | Cmd + V |
| 실행 취소 | Ctrl + Z | Cmd + Z |
| 다시 실행 | Ctrl + Y | Cmd + Y |
| 전체 선택 | Ctrl + A | Cmd + A |
| 저장 | Ctrl + S | Cmd + S |
| Import | Ctrl + Shift + I | Cmd + Shift + I |
| Export | Ctrl + Shift + E | Cmd + Shift + E |
| 자동 정렬 | Ctrl + Shift + L | Cmd + Shift + L |

## 팁과 트릭

### 1. 효율적인 작업

- **Zoom**: `Ctrl + Mouse Wheel` (확대/축소)
- **Pan**: `Space + Drag` (화면 이동)
- **다중 선택**: `Shift + Click` 또는 드래그
- **정렬**: 여러 테이블 선택 후 우클릭 → "Align"

### 2. 대용량 ERD 관리

- **레이어 사용**: 서비스별로 레이어 분리
- **북마크**: 자주 사용하는 테이블 북마크
- **검색**: `Ctrl + F`로 테이블/컬럼 검색

### 3. SQL 생성

1. 상단 메뉴 "Code" → "SQL DDL" 선택
2. 데이터베이스 선택 (PostgreSQL)
3. 생성된 SQL 복사

### 4. 문서화

- **주석 활용**: 각 테이블과 컬럼에 상세한 설명 추가
- **메모 사용**: 비즈니스 로직 문서화
- **색상 코딩**: 모듈별로 색상 구분

## 문제 해결

### Import 실패

**문제**: Import 시 오류 발생
**해결**:
1. 파일 인코딩 확인 (UTF-8)
2. 특수문자 확인
3. 형식 확인 (텍스트/JSON)

### 관계가 표시되지 않음

**문제**: FK 관계가 시각적으로 표시되지 않음
**해결**:
1. 컬럼 타입 확인 (양쪽이 동일한 타입이어야 함)
2. 관계 수동 추가
3. 자동 정렬 실행

### 느린 성능

**문제**: 많은 테이블로 인한 느린 성능
**해결**:
1. 브라우저 캐시 삭제
2. 레이어 기능으로 일부 테이블 숨기기
3. 서비스별로 ERD 분리

## 추가 리소스

### ERDCloud 공식 문서
- 홈페이지: https://www.erdcloud.com/
- 사용 가이드: https://www.erdcloud.com/guide

### 대안 도구

ERDCloud 외에도 다음 도구들을 고려할 수 있습니다:

1. **Draw.io (diagrams.net)**
   - 무료, 오픈소스
   - 다양한 다이어그램 지원
   - https://app.diagrams.net/

2. **dbdiagram.io**
   - 텍스트 기반 ERD
   - 간단한 문법
   - https://dbdiagram.io/

3. **DBeaver**
   - 데스크톱 애플리케이션
   - 실제 DB에서 ERD 생성
   - https://dbeaver.io/

4. **MySQL Workbench / pgAdmin**
   - 데이터베이스별 공식 도구
   - ERD 생성 및 역공학 지원

## SQL DDL 생성 (TypeORM)

프로젝트에서 직접 DDL을 생성하려면:

```bash
# 프로젝트 루트에서
cd services/product-service

# TypeORM CLI로 스키마 확인
npm run typeorm schema:log

# 또는 실제 데이터베이스에 적용
npm run typeorm schema:sync
```

**주의**: `schema:sync`는 개발 환경에서만 사용하세요. 프로덕션에서는 마이그레이션을 사용해야 합니다.

## 마이그레이션 생성

스키마 변경사항을 마이그레이션으로 관리:

```bash
# 마이그레이션 생성
npm run typeorm migration:generate -- -n AddNewColumn

# 마이그레이션 실행
npm run typeorm migration:run

# 마이그레이션 되돌리기
npm run typeorm migration:revert
```

## 결론

ERDCloud를 사용하면 DOA Market의 복잡한 데이터베이스 구조를 시각적으로 이해하고 관리할 수 있습니다. 이 가이드를 참고하여 효율적으로 ERD를 관리하세요.

## 관련 문서

- `DATABASE_DESIGN.md`: 데이터베이스 설계 문서
- `ERDCloud_Import.txt`: ERDCloud 텍스트 형식 Import 파일
- `ERDCloud_Import.vuerd.json`: ERDCloud JSON 형식 Import 파일

---

**작성일**: 2026-01-21
**버전**: 1.0
**작성자**: Claude
