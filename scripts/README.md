# 테스트 스크립트 가이드

## 📋 스크립트 목록

### 1. `run-all-tests.sh`

전체 서비스의 테스트를 실행하고 결과를 요약합니다.

**사용법:**

```bash
./scripts/run-all-tests.sh
```

**출력:**

- 각 서비스의 테스트 결과
- 커버리지 리포트 (coverage-reports/)
- 테스트 로그 (test-reports/)

### 2. `generate-test-report.sh`

전체 서비스의 테스트를 실행하고 HTML 보고서를 생성합니다.
**Bash 4+ 필요** (연관 배열 사용)

**사용법:**

```bash
# Bash 4+가 설치되어 있는 경우
./scripts/generate-test-report.sh

# 또는 bash 4+를 직접 지정
/usr/local/bin/bash ./scripts/generate-test-report.sh
```

**출력:**

- HTML 테스트 보고서 (test-reports/test-report-{timestamp}.html)
- 커버리지 리포트 (coverage-reports/)
- 상세 테스트 로그 (test-reports/)

### 3. `generate-test-report-simple.sh`

전체 서비스의 테스트를 실행하고 HTML 보고서를 생성합니다.
**Bash 3+ 호환** (연관 배열 미사용)

**사용법:**

```bash
./scripts/generate-test-report-simple.sh
```

**출력:**

- HTML 테스트 보고서 (test-reports/test-report-{timestamp}.html)
- 커버리지 리포트 (coverage-reports/)
- 상세 테스트 로그 (test-reports/)

**참고:** macOS 기본 bash는 3.x 버전이므로 이 스크립트를 사용하는 것을 권장합니다.

## 📊 보고서 확인

### HTML 보고서

브라우저에서 다음 파일을 열어 확인할 수 있습니다:

```
test-reports/test-report-{timestamp}.html
```

### 커버리지 리포트

각 서비스의 커버리지 리포트는 다음 위치에 있습니다:

```
coverage-reports/{service-name}_coverage/lcov-report/index.html
```

## 🔧 실행 전 준비사항

1. **의존성 설치**

   ```bash
   # 각 서비스 디렉토리에서
   npm install
   ```

2. **Jest 설정 확인**

   - 각 서비스에 `jest.config.js` 파일이 있는지 확인
   - `package.json`에 테스트 스크립트가 있는지 확인

3. **테스트 파일 확인**
   - 각 서비스의 `src/__tests__/` 디렉토리에 테스트 파일이 있는지 확인

## ⚠️ 주의사항

- 테스트는 Mock을 사용하므로 실제 데이터베이스 연결이 필요하지 않습니다.
- 일부 서비스에 테스트가 없을 수 있습니다. 이 경우 "건너뜀"으로 표시됩니다.
- 테스트 실행 시간은 서비스 수에 따라 다를 수 있습니다.
