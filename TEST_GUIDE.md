# DOA Market 테스트 가이드

## 📋 개요

이 문서는 DOA Market 백엔드 서비스들의 API 엔드포인트 테스트 실행 및 보고서 생성 방법을 설명합니다.

## 🚀 빠른 시작

### 전체 서비스 테스트 실행

```bash
# 루트 디렉토리에서
cd /Users/krystal/workspace/doa-market/backend

# 전체 테스트 실행 및 보고서 생성
./scripts/generate-test-report.sh
```

### 개별 서비스 테스트 실행

```bash
# 특정 서비스 디렉토리로 이동
cd banner-service

# 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 포함 테스트
npm run test:coverage
```

## 📊 테스트 구조

### 서비스별 테스트 파일 위치

각 서비스의 테스트 파일은 다음 위치에 있습니다:

```
{service-name}/
├── src/
│   └── __tests__/
│       └── {service}.api.test.ts  # API 엔드포인트 테스트
├── jest.config.js                 # Jest 설정
└── package.json                   # 테스트 스크립트 포함
```

### 테스트 파일 명명 규칙

- API 엔드포인트 테스트: `{service}.api.test.ts`
- 단위 테스트: `{service}.test.ts`
- 통합 테스트: `{service}.integration.test.ts`

## 🧪 테스트 작성 가이드

### 기본 테스트 구조

```typescript
import request from 'supertest';
import express from 'express';
import { routes } from '../routes';

// Mock 설정
jest.mock('../models/model');
jest.mock('../config/database');

const app = express();
app.use(express.json());
app.use('/api/v1/endpoint', routes);

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/endpoint', () => {
    it('should return list', async () => {
      // 테스트 로직
    });
  });
});
```

### 테스트 작성 체크리스트

- [ ] 모든 주요 엔드포인트 테스트
- [ ] 성공 케이스 테스트
- [ ] 실패 케이스 테스트 (404, 400, 500 등)
- [ ] 인증/권한 테스트 (필요한 경우)
- [ ] 입력 검증 테스트
- [ ] 페이지네이션 테스트 (목록 조회 API)

## 📈 커버리지 목표

- **최소 목표**: 60%
- **권장 목표**: 80%
- **이상적 목표**: 90%+

## 📄 보고서 확인

### HTML 보고서

테스트 실행 후 다음 위치에서 HTML 보고서를 확인할 수 있습니다:

```
test-reports/test-report-{timestamp}.html
```

### 커버리지 리포트

각 서비스의 커버리지 리포트는 다음 위치에 있습니다:

```
coverage-reports/{service-name}_coverage/lcov-report/index.html
```

### 로그 파일

각 서비스의 상세 테스트 로그는 다음 위치에 있습니다:

```
test-reports/{service-name}_test_{timestamp}.log
```

## 🔧 Jest 설정

### 기본 Jest 설정

각 서비스의 `jest.config.js`는 다음과 같은 구조를 따릅니다:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
```

## 📦 필요한 패키지

각 서비스의 `package.json`에 다음 devDependencies가 필요합니다:

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3"
  }
}
```

## 🎯 테스트 실행 스크립트

### package.json 스크립트

각 서비스의 `package.json`에 다음 스크립트가 포함되어야 합니다:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🔍 문제 해결

### 테스트가 실행되지 않는 경우

1. Jest 설정 파일 확인 (`jest.config.js`)
2. `package.json`에 테스트 스크립트 확인
3. 필요한 패키지 설치 확인: `npm install`

### 커버리지가 0%인 경우

1. `collectCoverageFrom` 설정 확인
2. 테스트 파일이 `src` 디렉토리 내에 있는지 확인
3. Mock 사용 시 실제 코드 실행 여부 확인

### 데이터베이스 연결 오류

테스트는 Mock을 사용하므로 실제 데이터베이스 연결이 필요하지 않습니다.
데이터베이스 모델은 `jest.mock()`으로 Mock 처리되어야 합니다.

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [Supertest 공식 문서](https://github.com/visionmedia/supertest)
- [TypeScript Jest 설정](https://jestjs.io/docs/getting-started#using-typescript)

## 🚨 주의사항

1. **Mock 사용**: 실제 데이터베이스나 외부 서비스에 연결하지 않도록 Mock을 사용합니다.
2. **독립성**: 각 테스트는 독립적으로 실행되어야 합니다.
3. **정리**: `beforeEach`나 `afterEach`에서 Mock을 정리합니다.
4. **비동기 처리**: `async/await`를 사용하여 비동기 테스트를 올바르게 처리합니다.

