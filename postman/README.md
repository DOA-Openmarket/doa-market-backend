# DOA Market API Testing & Load Testing

이 디렉토리에는 DOA Market API를 테스트하고 부하 테스트를 수행하기 위한 Postman 컬렉션과 Newman 스크립트가 포함되어 있습니다.

## 📁 파일 구조

```
postman/
├── DOA-Market-API.postman_collection.json       # 전체 API 엔드포인트 컬렉션
├── DOA-Market-Local.postman_environment.json    # 로컬 환경 변수
├── DOA-Market-Production.postman_environment.json # 프로덕션 환경 변수
├── load-test.js                                  # 부하 테스트 스크립트
├── package.json                                  # npm 의존성 및 스크립트
└── README.md                                     # 이 파일
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd postman
npm install
```

### 2. API 접근 설정

#### 옵션 A: Port Forwarding (로컬 테스트용)

Kubernetes에서 API Gateway를 로컬로 포트포워딩:

```bash
kubectl port-forward -n doa-market-prod svc/api-gateway 3000:3000
```

이후 로컬 환경(`DOA-Market-Local.postman_environment.json`)을 사용하여 테스트합니다.

#### 옵션 B: Production URL (프로덕션 테스트용)

프로덕션 환경에서 테스트하려면 먼저 Ingress Controller를 설정해야 합니다:

```bash
# NGINX Ingress Controller 설치
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/aws/deploy.yaml

# LoadBalancer 주소 확인
kubectl get svc -n ingress-nginx
```

LoadBalancer의 외부 IP를 얻은 후 DNS를 설정하거나, `/etc/hosts` 파일을 수정하여 테스트할 수 있습니다.

## 📦 Postman에서 사용하기

### 컬렉션 Import

1. Postman을 엽니다
2. `Import` 버튼 클릭
3. `DOA-Market-API.postman_collection.json` 파일 선택
4. `DOA-Market-Local.postman_environment.json` 또는 `DOA-Market-Production.postman_environment.json` Import

### 환경 변수 설정

1. 상단 우측의 환경 드롭다운에서 `DOA Market - Local` 또는 `DOA Market - Production` 선택
2. 필요시 `baseUrl` 값 수정

### API 테스트 플로우

1. **Health Check**: 먼저 `Health Checks` 폴더의 요청으로 API Gateway가 정상인지 확인
2. **User Register/Login**: `Authentication` 폴더에서 회원가입 또는 로그인
   - 성공 시 자동으로 `accessToken`과 `refreshToken`이 환경 변수에 저장됩니다
3. **인증이 필요한 API 테스트**: 이제 다른 엔드포인트들을 테스트할 수 있습니다

## 🧪 Newman으로 CLI 테스트

### 기본 테스트

```bash
# 전체 컬렉션 실행 (로컬)
npm test

# 전체 컬렉션 실행 (프로덕션)
npm run test:prod

# 특정 폴더만 실행
npm run test:health      # Health checks만
npm run test:auth        # Authentication만
npm run test:products    # Products만
npm run test:orders      # Orders만
```

### HTML 리포트 생성

```bash
# 로컬 환경 테스트 리포트
npm run report

# 프로덕션 환경 테스트 리포트
npm run report:prod

# 리포트 확인
open reports/test-report.html
```

## ⚡ 부하 테스트

### 사전 설정된 부하 테스트

```bash
# 가벼운 부하 테스트 (5명 사용자, 5회 반복)
npm run load-test:light

# 중간 부하 테스트 (20명 사용자, 10회 반복)
npm run load-test:medium

# 무거운 부하 테스트 (50명 사용자, 20회 반복)
npm run load-test:heavy

# 스트레스 테스트 (100명 사용자, 50회 반복)
npm run load-test:stress

# 프로덕션 부하 테스트
npm run load-test:prod

# 특정 기능 부하 테스트
npm run load-test:products   # 상품 API만
npm run load-test:orders      # 주문 API만
```

### 커스텀 부하 테스트

```bash
# 기본 사용법
node load-test.js [options]

# 옵션:
#   --iterations <n>     사용자당 반복 횟수 (기본: 10)
#   --concurrent <n>     동시 사용자 수 (기본: 10)
#   --environment <env>  환경: local 또는 production (기본: local)
#   --delay <ms>         요청 간 지연 시간 (기본: 100ms)
#   --folder <name>      특정 폴더만 실행

# 예시: 30명 사용자, 15회 반복, 200ms 지연
node load-test.js --concurrent 30 --iterations 15 --delay 200

# 예시: 상품 API에 대한 부하 테스트
node load-test.js --folder Products --concurrent 50 --iterations 20

# 예시: 프로덕션에서 주문 API 부하 테스트
node load-test.js --folder Orders --environment production --concurrent 20 --iterations 10
```

### 부하 테스트 결과 해석

부하 테스트 완료 후 다음과 같은 메트릭이 표시됩니다:

```
═══════════════════════════════════════════════
📈 Load Test Results
═══════════════════════════════════════════════
⏱️  Total Duration: 45.23s
📊 Total Requests: 500
✅ Successful: 495 (99.00%)
❌ Failed: 5 (1.00%)

⚡ Performance Metrics:
   Requests/sec: 11.05
   Avg Response Time: 150.25ms
   Min Response Time: 50ms
   Max Response Time: 1200ms
═══════════════════════════════════════════════
```

**성능 기준:**
- **Requests/sec**: 10+ 권장 (낮을수록 서버 처리량 부족)
- **Avg Response Time**: 500ms 이하 권장 (높을수록 느린 응답)
- **Success Rate**: 95% 이상 권장

## 📊 API 엔드포인트 목록

### Health Checks
- `GET /health` - API Gateway 상태 확인
- `GET /api/v1/health` - API Gateway 상세 상태

### Authentication (인증 불필요)
- `POST /api/v1/auth/register` - 사용자 회원가입
- `POST /api/v1/auth/login` - 사용자 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃
- `GET /api/v1/auth/me` - 현재 사용자 정보
- `POST /api/v1/auth/send-verification` - 이메일 인증 전송
- `POST /api/v1/auth/verify-email` - 이메일 인증 확인
- `POST /api/v1/sellers/sign-up` - 판매자 회원가입
- `POST /api/v1/sellers/sign-in` - 판매자 로그인

### Users (인증 필요)
- `GET /api/v1/users` - 사용자 목록
- `POST /api/v1/users` - 사용자 생성
- `GET /api/v1/users/:id` - 사용자 상세
- `PATCH /api/v1/users/:id` - 사용자 수정
- `DELETE /api/v1/users/:id` - 사용자 삭제
- `GET /api/v1/users/stats` - 사용자 통계

### Products (인증 선택)
- `GET /api/v1/products` - 상품 목록 (캐싱)
- `GET /api/v1/products/:id` - 상품 상세 (캐싱)
- `POST /api/v1/products` - 상품 생성 (인증 필요)
- `PUT /api/v1/products/:id` - 상품 수정 (인증 필요)
- `DELETE /api/v1/products/:id` - 상품 삭제 (인증 필요)
- `GET /api/v1/products/:productId/reviews` - 상품 리뷰 목록

### Categories (인증 불필요)
- `GET /api/v1/categories` - 카테고리 목록 (캐싱)

### Orders (인증 필요)
- `GET /api/v1/orders` - 주문 목록
- `GET /api/v1/orders/:id` - 주문 상세
- `POST /api/v1/orders` - 주문 생성
- `PATCH /api/v1/orders/:id/status` - 주문 상태 변경
- `POST /api/v1/orders/:orderId/cancel` - 주문 취소
- `POST /api/v1/orders/:orderId/return` - 반품 신청
- `POST /api/v1/orders/:orderId/exchange` - 교환 신청
- `GET /api/v1/orders/:id/saga-status` - 주문 Saga 상태

### Cart (인증 필요)
- `GET /api/v1/cart` - 장바구니 조회
- `POST /api/v1/cart` - 장바구니 추가
- `PATCH /api/v1/cart/:cartItemId` - 장바구니 항목 수정
- `DELETE /api/v1/cart/:cartItemId` - 장바구니 항목 삭제
- `DELETE /api/v1/cart` - 장바구니 비우기

### Reviews (인증 선택)
- `GET /api/v1/reviews` - 리뷰 목록
- `GET /api/v1/reviews/:id` - 리뷰 상세
- `POST /api/v1/reviews` - 리뷰 작성 (인증 필요)
- `PUT /api/v1/reviews/:id` - 리뷰 수정 (인증 필요)
- `DELETE /api/v1/reviews/:id` - 리뷰 삭제 (인증 필요)
- `GET /api/v1/reviews/products/:productId` - 상품별 리뷰
- `GET /api/v1/reviews/seller/:sellerId` - 판매자별 리뷰

### Banners (인증 선택)
- `GET /api/v1/banners` - 배너 목록
- `GET /api/v1/banners/:id` - 배너 상세
- `POST /api/v1/banners` - 배너 생성 (인증 필요)
- `PUT /api/v1/banners/:id` - 배너 수정 (인증 필요)
- `DELETE /api/v1/banners/:id` - 배너 삭제 (인증 필요)

### Search (인증 불필요)
- `GET /api/v1/search/products` - 상품 검색 (캐싱)
- `GET /api/v1/search/autocomplete` - 자동완성 (캐싱)

### Coupons (인증 선택)
- `GET /api/v1/coupons` - 쿠폰 목록
- `GET /api/v1/coupons/:id` - 쿠폰 상세
- `POST /api/v1/coupons` - 쿠폰 생성 (인증 필요)
- `POST /api/v1/coupons/:code/issue` - 쿠폰 발급 (인증 필요)
- `GET /api/v1/coupons/seller/:sellerId` - 판매자별 쿠폰

### Sellers (판매자/관리자 권한 필요)
- `GET /api/v1/sellers` - 판매자 목록
- `GET /api/v1/sellers/stats` - 판매자 통계
- `GET /api/v1/sellers/:id` - 판매자 상세
- `POST /api/v1/sellers` - 판매자 생성
- `PUT /api/v1/sellers/:id` - 판매자 수정
- `PATCH /api/v1/sellers/:id/verify` - 판매자 검증

### Notifications (인증 필요)
- `GET /api/v1/notifications` - 알림 목록
- `POST /api/v1/notifications` - 알림 생성
- `POST /api/v1/notifications/:id/send` - 알림 전송

## 🔐 인증 흐름

1. **회원가입/로그인**
   ```
   POST /api/v1/auth/register 또는 /api/v1/auth/login
   Response: { data: { accessToken, refreshToken, user } }
   ```

2. **토큰 자동 저장**
   - Postman 컬렉션의 Test 스크립트가 자동으로 토큰을 환경 변수에 저장
   - `accessToken`: Bearer 토큰으로 API 요청에 사용
   - `refreshToken`: 토큰 갱신용
   - `userId`, `userEmail`: 다른 요청에서 사용

3. **인증된 요청**
   ```
   Authorization: Bearer {{accessToken}}
   ```
   - 컬렉션 레벨에서 자동으로 설정됨
   - 인증이 불필요한 요청은 개별적으로 "No Auth" 설정

4. **토큰 갱신**
   ```
   POST /api/v1/auth/refresh
   Body: { refreshToken: "{{refreshToken}}" }
   ```

## 🐛 트러블슈팅

### Port Forwarding이 연결되지 않음
```bash
# API Gateway Pod 이름 확인
kubectl get pods -n doa-market-prod | grep api-gateway

# 특정 Pod로 직접 포트포워딩
kubectl port-forward -n doa-market-prod pod/<pod-name> 3000:3000
```

### 인증 토큰 만료
- `POST /api/v1/auth/refresh` 요청으로 토큰 갱신
- 또는 다시 로그인

### 부하 테스트 시 높은 실패율
- `--delay` 옵션으로 요청 간 지연 시간 증가
- `--concurrent` 값 감소로 동시 사용자 수 줄이기
- 서버 리소스(CPU, Memory) 확인

### Newman 의존성 오류
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📚 추가 리소스

- [Postman Documentation](https://learning.postman.com/docs/)
- [Newman Documentation](https://github.com/postmanlabs/newman)
- [DOA Market Troubleshooting Guide](../docs/TROUBLESHOOTING.md)

## 🤝 기여

API 엔드포인트가 추가되거나 변경될 때마다 이 컬렉션을 업데이트해주세요:

1. Postman에서 컬렉션 수정
2. Export → Collection v2.1
3. `DOA-Market-API.postman_collection.json` 파일 덮어쓰기
4. Git commit & push

---

**문의사항이나 이슈가 있으면 개발팀에 연락하세요.**
