# Auth Service

인증 및 인가를 담당하는 마이크로서비스입니다.

## 기능

- ✅ 사용자 회원가입 (이메일/비밀번호)
- ✅ 로그인 (JWT Access Token + Refresh Token)
- ✅ 토큰 갱신
- ✅ 로그아웃
- ✅ 현재 사용자 정보 조회
- ✅ Rate Limiting (무차별 대입 공격 방지)
- ✅ 비밀번호 해싱 (bcrypt)

## 기술 스택

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston

## API 엔드포인트

### Public Endpoints

```
POST   /api/v1/auth/register    # 회원가입
POST   /api/v1/auth/login       # 로그인
POST   /api/v1/auth/refresh     # 토큰 갱신
```

### Protected Endpoints

```
POST   /api/v1/auth/logout      # 로그아웃
GET    /api/v1/auth/me          # 현재 사용자 정보
```

## 시작하기

### 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### Docker로 실행

```bash
# Docker Compose로 전체 환경 실행
cd ../..
docker-compose up -d

# Auth Service 로그 확인
docker-compose logs -f auth-service
```

## 테스트

```bash
# 단위 테스트
npm test

# 테스트 (watch 모드)
npm run test:watch

# 커버리지
npm run test:coverage
```

## 환경변수

`.env` 파일에 다음 변수들을 설정하세요:

```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doa_auth
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3100,http://localhost:3200
```

## 데이터베이스 스키마

### Users 테이블

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'seller', 'user') DEFAULT 'user',
  status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Refresh Tokens 테이블

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API 사용 예시

### 회원가입

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### 로그인

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 토큰 갱신

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### 현재 사용자 정보

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer your-access-token"
```

## 보안

- ✅ 비밀번호는 bcrypt로 해싱 (salt rounds: 10)
- ✅ JWT Access Token: 15분 유효
- ✅ JWT Refresh Token: 7일 유효
- ✅ Rate Limiting: 15분당 10회 (로그인/회원가입)
- ✅ CORS 설정
- ✅ Helmet.js 보안 헤더

## 문제 해결

### PostgreSQL 연결 실패

```bash
# PostgreSQL이 실행 중인지 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres
```

### 포트 충돌

`.env` 파일에서 `PORT`를 변경하세요.

## 라이선스

MIT

