# Product Q&A Service (상품 문의 서비스)

상품에 대한 공개 Q&A 서비스입니다.

## 기능

- 상품 문의 작성 (공개/비밀글)
- 판매자 답변
- 문의 목록 조회 (상품별, 사용자별, 판매자별)
- 도움이 됐어요 기능
- 문의/답변 통계

## API 엔드포인트

### 상품 문의 작성
```
POST /api/v1/product-qna
Body: {
  "productId": "uuid",
  "userId": "uuid",
  "sellerId": "uuid",
  "title": "문의 제목",
  "question": "문의 내용",
  "isSecret": false,
  "images": ["url1", "url2"]
}
```

### 문의 조회
```
GET /api/v1/product-qna/:id?userId=uuid
```

### 상품별 문의 목록
```
GET /api/v1/product-qna/products/:productId?userId=uuid&page=1&limit=20
```

### 사용자별 문의 목록
```
GET /api/v1/product-qna/users/:userId?page=1&limit=20
```

### 판매자별 문의 목록
```
GET /api/v1/product-qna/sellers/:sellerId?status=pending&page=1&limit=20
```

### 답변 작성
```
POST /api/v1/product-qna/answer
Body: {
  "qnaId": "uuid",
  "answeredBy": "uuid",
  "answer": "답변 내용",
  "answerImages": ["url1"]
}
```

### 답변 수정
```
PATCH /api/v1/product-qna/:id/answer
Body: {
  "answer": "수정된 답변",
  "answerImages": []
}
```

### 문의 삭제
```
DELETE /api/v1/product-qna/:id
Body: {
  "userId": "uuid"
}
```

### 도움이 됐어요 추가
```
POST /api/v1/product-qna/helpful
Body: {
  "qnaId": "uuid",
  "userId": "uuid"
}
```

### 도움이 됐어요 취소
```
DELETE /api/v1/product-qna/helpful
Body: {
  "qnaId": "uuid",
  "userId": "uuid"
}
```

### 통계 조회
```
GET /api/v1/product-qna/admin/stats?productId=uuid
```

## 환경 변수

```
PORT=3019
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=product_qna_db
NODE_ENV=development
```

## 실행

```bash
npm install
npm run dev
```

