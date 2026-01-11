# Inquiry Service (1:1 문의 서비스)

고객 1:1 문의 및 고객센터 서비스입니다.

## 기능

- 1:1 문의 작성
- 문의 조회 (사용자 & 관리자)
- 문의 답변
- 문의 상태 관리 (대기, 처리중, 답변완료, 종료)
- 문의 타입별 분류 (상품, 주문, 배송, 결제, 환불 등)
- 우선순위 관리
- 문의 통계

## API 엔드포인트

### 문의 생성
```
POST /api/v1/inquiries
Body: {
  "userId": "uuid",
  "type": "order",
  "title": "주문 문의드립니다",
  "content": "주문 내용...",
  "priority": "normal",
  "orderId": "order-uuid",
  "images": ["url1", "url2"]
}
```

### 문의 조회
```
GET /api/v1/inquiries/:id?includeResponses=true
```

### 사용자 문의 목록
```
GET /api/v1/inquiries/users/:userId?page=1&limit=20
```

### 모든 문의 목록 (관리자)
```
GET /api/v1/inquiries/admin/all?status=pending&type=order&page=1&limit=20
```

### 문의 업데이트
```
PATCH /api/v1/inquiries/:id
Body: {
  "status": "answered",
  "priority": "high",
  "assignedTo": "admin-uuid"
}
```

### 답변 추가
```
POST /api/v1/inquiries/responses
Body: {
  "inquiryId": "inquiry-uuid",
  "userId": "user-uuid",
  "content": "답변 내용",
  "isAdmin": true,
  "images": [],
  "isInternal": false
}
```

### 문의 삭제
```
DELETE /api/v1/inquiries/:id
Body: {
  "userId": "user-uuid"
}
```

### 문의 통계 (관리자)
```
GET /api/v1/inquiries/admin/stats
```

## 환경 변수

```
PORT=3017
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=inquiry_service_db
NODE_ENV=development
```

## 실행

```bash
npm install
npm run dev
```

