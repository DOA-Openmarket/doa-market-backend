# Point Service

포인트 및 적립금 관리 서비스입니다.

## 기능

- 포인트 적립 (구매, 리뷰, 이벤트 등)
- 포인트 사용
- 포인트 환불
- 포인트 만료 처리
- 거래 내역 조회
- 만료 예정 포인트 조회

## API 엔드포인트

### 포인트 적립
```
POST /api/v1/points/earn
Body: {
  "userId": "uuid",
  "amount": 1000,
  "source": "purchase",
  "referenceId": "order-id",
  "description": "구매 적립",
  "expiresInDays": 365
}
```

### 포인트 사용
```
POST /api/v1/points/use
Body: {
  "userId": "uuid",
  "amount": 500,
  "referenceId": "order-id",
  "description": "주문 결제"
}
```

### 포인트 환불
```
POST /api/v1/points/refund
Body: {
  "userId": "uuid",
  "amount": 500,
  "referenceId": "order-id"
}
```

### 사용자 포인트 조회
```
GET /api/v1/points/users/:userId
```

### 거래 내역 조회
```
GET /api/v1/points/users/:userId/transactions?page=1&limit=20
```

### 만료 예정 포인트 조회
```
GET /api/v1/points/users/:userId/expiring?days=30
```

## 환경 변수

```
PORT=3016
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=point_service_db
NODE_ENV=development
```

## 실행

```bash
npm install
npm run dev
```

