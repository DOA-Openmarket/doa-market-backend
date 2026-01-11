# Recently Viewed Service (최근 본 상품 서비스)

사용자가 최근에 조회한 상품을 추적하고 관리하는 서비스입니다.

## 기능

- 최근 본 상품 추적
- 상품 조회 횟수 카운팅
- 상품 정보 캐싱 (빠른 조회)
- 사용자별 최대 100개 자동 관리
- 상품별 조회 통계
- 사용자 관심 분석 (추천 시스템용)

## API 엔드포인트

### 최근 본 상품 추가/업데이트
```
POST /api/v1/recently-viewed
Body: {
  "userId": "uuid",
  "productId": "uuid",
  "productName": "상품명",
  "productPrice": 10000,
  "productImage": "image-url",
  "sellerName": "판매자명"
}
```

### 사용자의 최근 본 상품 목록
```
GET /api/v1/recently-viewed/users/:userId?page=1&limit=20
```

### 특정 상품 삭제
```
DELETE /api/v1/recently-viewed/users/:userId/products/:productId
```

### 모두 삭제
```
DELETE /api/v1/recently-viewed/users/:userId
```

### 상품 조회 통계
```
GET /api/v1/recently-viewed/products/:productId/stats
Response: {
  "totalViews": 150,
  "uniqueUsers": 75
}
```

### 사용자 관심 분석
```
GET /api/v1/recently-viewed/users/:userId/analysis
Response: {
  "totalViews": 50,
  "avgPrice": 25000,
  "priceRange": { "min": 5000, "max": 100000 },
  "recentProducts": ["uuid1", "uuid2", ...]
}
```

## 환경 변수

```
PORT=3018
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=recently_viewed_db
NODE_ENV=development
```

## 실행

```bash
npm install
npm run dev
```

