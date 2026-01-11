# Docker Compose 로컬 개발 환경 설정 가이드

이 가이드는 AWS Fargate 배포를 목표로 하되, 현재는 로컬 개발 환경에서 마이크로 서비스들을 테스트할 수 있도록 구성되었습니다.

## 📋 개요

- **17개 마이크로 서비스** (API Gateway + 16개 서비스)
- **PostgreSQL** 데이터베이스 (각 서비스별 독립 데이터베이스)
- **Redis** 캐시 및 세션 저장소
- **Docker Compose**를 통한 통합 관리

## 🚀 빠른 시작

### 1. 전체 환경 실행 (프로덕션 모드)

```bash
# 루트 디렉토리에서
cd /Users/krystal/workspace/doa-market/backend

# 모든 서비스 빌드 및 실행
docker-compose up --build -d

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### 2. 로컬 개발 모드 (소스 코드 변경 시 자동 반영)

```bash
# 개발 모드로 실행 (볼륨 마운트 + nodemon)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 백그라운드 실행
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. 특정 서비스만 실행

```bash
# 인프라만 실행
docker-compose up -d postgres redis

# 특정 서비스만 실행
docker-compose up -d auth-service user-service product-service
```

## 📊 서비스 포트 맵

| 서비스               | 포트 | 데이터베이스      | Redis 사용 |
| -------------------- | ---- | ---------------- | ---------- |
| api-gateway          | 3000 | -                | ✅         |
| auth-service         | 3001 | doa_auth         | ✅         |
| user-service         | 3002 | doa_users        | -          |
| product-service      | 3003 | doa_products      | ✅         |
| order-service        | 3004 | doa_orders        | -          |
| payment-service      | 3005 | doa_payments      | -          |
| shipping-service     | 3006 | doa_shippings     | -          |
| seller-service       | 3007 | doa_sellers       | -          |
| settlement-service   | 3008 | doa_settlements   | -          |
| coupon-service       | 3009 | doa_coupons       | ✅         |
| inventory-service    | 3010 | doa_inventory     | ✅         |
| notification-service | 3011 | doa_notifications | -          |
| review-service       | 3012 | doa_reviews       | -          |
| search-service       | 3013 | -                | -          |
| admin-service        | 3014 | -                | -          |
| file-service         | 3015 | -                | -          |
| stats-service        | 3016 | doa_stats         | ✅         |

## 🔧 인프라 서비스

| 서비스     | 포트 | 용도                |
| ---------- | ---- | ------------------- |
| PostgreSQL | 5432 | 관계형 데이터베이스 |
| Redis      | 6379 | 캐시 & 세션         |

## 🧪 테스트

### Health Check

```bash
# 모든 서비스 Health Check
for port in {3000..3016}; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/api/v1/health 2>/dev/null | jq -r '.service + " - " + .status' || echo "❌ DOWN"
done
```

### API Gateway를 통한 요청

```bash
# API Gateway Health Check
curl http://localhost:3000/api/v1/health

# Auth Service를 통한 회원가입
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'
```

## 📝 환경 변수 설정

### JWT 시크릿 설정 (중요!)

프로덕션 환경에서는 반드시 변경하세요:

```bash
# .env 파일 생성 (선택사항)
export JWT_ACCESS_SECRET=your-secure-access-secret
export JWT_REFRESH_SECRET=your-secure-refresh-secret

# 또는 docker-compose.yml에서 직접 수정
```

## 🔍 문제 해결

### 서비스가 시작되지 않음

```bash
# 특정 서비스 로그 확인
docker-compose logs auth-service

# 컨테이너 재시작
docker-compose restart auth-service

# 완전히 재구축
docker-compose down
docker-compose up --build -d
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# PostgreSQL 로그
docker-compose logs postgres

# 데이터베이스 목록 확인
docker exec -it doa-postgres psql -U postgres -c "\l"
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>

# 또는 docker-compose.yml에서 포트 변경
```

### 볼륨 문제 (개발 모드)

```bash
# 볼륨 확인
docker volume ls

# 볼륨 삭제 (주의: 데이터 손실)
docker-compose down -v
```

## 🛑 서비스 중지

```bash
# 모든 서비스 중지
docker-compose down

# 볼륨까지 삭제 (주의: 데이터 손실)
docker-compose down -v

# 특정 서비스만 중지
docker-compose stop auth-service
```

## 📦 AWS Fargate 배포 준비

현재 Docker Compose 설정은 AWS Fargate 배포를 위한 기반을 제공합니다:

1. **각 서비스는 독립적인 Dockerfile**을 가지고 있어 ECS Task Definition으로 변환 가능
2. **환경 변수는 환경별로 분리** 가능 (dev, staging, production)
3. **네트워크 설정은 ECS Service Discovery**로 대체 가능
4. **데이터베이스는 RDS/Aurora**로 마이그레이션 가능
5. **Redis는 ElastiCache**로 대체 가능

### 다음 단계

1. 각 서비스를 ECR에 푸시
2. ECS Task Definition 생성
3. ECS Service 생성 (Fargate)
4. Application Load Balancer 설정
5. RDS 및 ElastiCache 설정
6. 환경 변수를 AWS Systems Manager Parameter Store 또는 Secrets Manager로 이동

## 🔗 유용한 명령어

```bash
# 특정 서비스 로그 실시간 확인
docker-compose logs -f auth-service

# 모든 서비스 로그
docker-compose logs -f

# 서비스 재시작
docker-compose restart auth-service

# 서비스 재빌드
docker-compose up --build -d auth-service

# 컨테이너 내부 접속
docker exec -it doa-auth-service sh

# 네트워크 확인
docker network inspect backend_doa-network
```

## 📚 추가 리소스

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [AWS ECS Fargate 가이드](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Fargate 모범 사례](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/fargate.html)

