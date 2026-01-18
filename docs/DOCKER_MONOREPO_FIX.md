# Docker Monorepo Build Fix

## 문제 상황

CI/CD에서 user-service와 product-service 빌드 시 다음 에러 발생:

```
error TS2307: Cannot find module '@doa-market/common' or its corresponding type declarations.
```

## 원인

1. **모노레포 구조 미반영**: 서비스들이 `packages/common`을 참조하지만, Docker 빌드 컨텍스트가 개별 서비스 디렉토리로 제한됨
2. **GitHub Actions 빌드 컨텍스트**: `.github/workflows/ci-build-push.yml`에서 `docker build` 명령이 `${{ matrix.service }}` 디렉토리를 컨텍스트로 사용
3. **Dockerfile COPY 명령**: `packages/common`을 찾을 수 없음

## 해결 방법

### 1. Dockerfile 수정 (Multi-stage Build)

**적용 대상**: `user-service/Dockerfile`, `product-service/Dockerfile`

**변경 내용**:
- 빌드 컨텍스트를 backend 루트로 변경
- `packages/common`을 먼저 빌드
- 빌드된 common 패키지를 서비스의 `node_modules/@doa-market/`에 복사

```dockerfile
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy and build common package first
COPY packages/common ./packages/common
WORKDIR /app/packages/common
RUN npm install && npm run build

# Copy service files
WORKDIR /app/user-service
COPY user-service/package*.json ./
RUN npm install

# Copy built common package into node_modules
RUN mkdir -p node_modules/@doa-market && \
    cp -r ../packages/common node_modules/@doa-market/

# Copy service source
COPY user-service/ ./

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built service and dependencies
COPY --from=builder /app/user-service/package*.json ./
COPY --from=builder /app/user-service/dist ./dist
COPY --from=builder /app/user-service/node_modules ./node_modules

EXPOSE 3002
CMD ["npm", "start"]
```

### 2. GitHub Actions Workflow 수정

**파일**: `.github/workflows/ci-build-push.yml`

**변경 1 - Docker 빌드 컨텍스트**:
```yaml
# Before
docker build \
  -f ${{ matrix.service }}/Dockerfile \
  -t $ECR_REGISTRY/doa-market-${{ matrix.service }}:$IMAGE_TAG \
  ${{ matrix.service }}  # ❌ 서비스 디렉토리만 컨텍스트

# After
docker build \
  -f ${{ matrix.service }}/Dockerfile \
  -t $ECR_REGISTRY/doa-market-${{ matrix.service }}:$IMAGE_TAG \
  .  # ✅ backend 루트 디렉토리가 컨텍스트
```

**변경 2 - packages/common 변경 감지**:
```yaml
# Before
product-service:
  - 'product-service/**'
  - '_shared/**'

# After
product-service:
  - 'product-service/**'
  - '_shared/**'
  - 'packages/common/**'  # ✅ common 변경 시 재빌드
```

이제 `packages/common`에 변경이 생기면 모든 서비스가 자동으로 재빌드됩니다.

## 동작 방식

### 빌드 프로세스

1. **Builder Stage**:
   ```
   /app/
   ├── packages/common/          # COPY packages/common
   │   ├── dist/                 # npm run build 결과
   │   ├── src/
   │   └── package.json
   └── user-service/
       ├── node_modules/
       │   └── @doa-market/
       │       └── common/       # cp -r ../packages/common
       │           ├── dist/
       │           ├── src/
       │           └── package.json
       ├── src/
       └── dist/                  # npm run build 결과
   ```

2. **Production Stage**:
   ```
   /app/
   ├── package.json              # COPY from builder
   ├── dist/                     # COPY from builder
   └── node_modules/             # COPY from builder (common 포함)
       └── @doa-market/
           └── common/
   ```

### Import 해결

서비스 코드에서:
```typescript
import { createMetricsService } from '@doa-market/common';
```

TypeScript 컴파일러가 `node_modules/@doa-market/common`을 찾음:
- `package.json`의 `"main": "dist/index.js"`
- `package.json`의 `"types": "dist/index.d.ts"`

## 검증 방법

### 로컬 테스트 (Docker 실행 중인 경우)

```bash
# user-service 빌드 테스트
cd /Users/krystal/workspace/doa-market/backend
docker build -f user-service/Dockerfile -t test-user-service:latest .

# product-service 빌드 테스트
docker build -f product-service/Dockerfile -t test-product-service:latest .

# 빌드 성공 시 컨테이너 실행
docker run -p 3002:3002 test-user-service:latest
```

### CI/CD 테스트

1. **코드 커밋 및 푸시**:
   ```bash
   git add .
   git commit -m "fix: Update Dockerfile for monorepo structure with packages/common"
   git push origin main
   ```

2. **GitHub Actions 확인**:
   - https://github.com/DOA-Openmarket/doa-market-backend/actions
   - `CI - Build and Push to ECR` 워크플로우 확인
   - user-service와 product-service 빌드 성공 확인

3. **빌드 로그 확인**:
   ```
   Step 4/16 : COPY packages/common ./packages/common
   Step 5/16 : WORKDIR /app/packages/common
   Step 6/16 : RUN npm install && npm run build
   Step 9/16 : RUN npm install
   Step 11/16 : RUN mkdir -p node_modules/@doa-market && cp -r ../packages/common...
   Step 14/16 : RUN npm run build
   ```

## 적용 대상 서비스

현재 적용된 서비스:
- ✅ user-service
- ✅ product-service

향후 메트릭 통합 시 동일 패턴 적용 필요:
- api-gateway
- auth-service
- order-service
- payment-service
- cart-service
- review-service
- notification-service
- search-service
- inventory-service
- seller-service
- admin-service
- file-service
- banner-service
- coupon-service
- shipping-service
- stats-service
- settlement-service

## 대안 방안 (향후 고려)

### 방안 1: npm workspaces 사용

**장점**:
- 표준 모노레포 패턴
- npm이 심볼릭 링크 자동 관리
- `npm install` 한 번으로 모든 의존성 설치

**단점**:
- 전체 구조 변경 필요
- 기존 CI/CD 파이프라인 대폭 수정

**구조**:
```json
// backend/package.json
{
  "name": "doa-market-backend",
  "workspaces": [
    "packages/*",
    "api-gateway",
    "user-service",
    "product-service"
  ]
}
```

### 방안 2: Private npm registry 사용

**장점**:
- @doa-market/common을 실제 패키지로 배포
- Dockerfile이 단순해짐
- 버전 관리 명확

**단점**:
- npm registry 구축/유지 비용
- 배포 프로세스 추가

### 방안 3: Git submodule (비추천)

**단점**:
- 관리 복잡도 증가
- CI/CD에서 submodule 동기화 필요
- 코드 변경 시 커밋 2번 필요

## 결론

현재 채택한 **Multi-stage Docker build + 수동 복사** 방식이 가장 적합:
- ✅ 최소 변경으로 문제 해결
- ✅ CI/CD 파이프라인 영향 최소화
- ✅ 추가 인프라 불필요
- ✅ 명확한 의존성 관리

향후 서비스 수가 증가하면 npm workspaces로 마이그레이션 고려.
