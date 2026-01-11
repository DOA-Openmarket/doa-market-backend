# Address Service (배송지 관리 서비스)

사용자의 배송지를 관리하는 서비스입니다.

## 기능

- 배송지 추가 (최대 10개)
- 배송지 조회/목록
- 배송지 수정/삭제
- 기본 배송지 설정
- 마지막 사용 시간 추적
- 주소 확인 표시

## API 엔드포인트

### 배송지 추가
```
POST /api/v1/addresses
Body: {
  "userId": "uuid",
  "recipientName": "홍길동",
  "recipientPhone": "010-1234-5678",
  "postalCode": "12345",
  "addressLine1": "서울시 강남구 테헤란로 123",
  "addressLine2": "ABC빌딩 456호",
  "city": "서울",
  "district": "강남구",
  "neighborhood": "역삼동",
  "country": "Korea",
  "addressType": "home",
  "addressLabel": "집",
  "deliveryRequest": "문 앞에 놔주세요",
  "entrancePassword": "1234",
  "isDefault": true
}
```

### 배송지 조회
```
GET /api/v1/addresses/:id?userId=uuid
```

### 사용자의 배송지 목록
```
GET /api/v1/addresses/users/:userId
```

### 기본 배송지 조회
```
GET /api/v1/addresses/users/:userId/default
```

### 배송지 수정
```
PATCH /api/v1/addresses/:id
Body: {
  "userId": "uuid",
  "recipientName": "김철수",
  ...
}
```

### 기본 배송지 설정
```
POST /api/v1/addresses/:id/set-default
Body: {
  "userId": "uuid"
}
```

### 배송지 삭제
```
DELETE /api/v1/addresses/:id
Body: {
  "userId": "uuid"
}
```

### 마지막 사용 시간 업데이트
```
POST /api/v1/addresses/:id/update-last-used
Body: {
  "userId": "uuid"
}
```

### 주소 확인 표시
```
POST /api/v1/addresses/:id/verify
Body: {
  "userId": "uuid"
}
```

## 환경 변수

```
PORT=3020
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=address_service_db
NODE_ENV=development
```

## 실행

```bash
npm install
npm run dev
```

