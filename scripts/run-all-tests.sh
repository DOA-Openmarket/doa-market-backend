#!/bin/bash

# 전체 서비스 테스트 실행 및 보고서 생성 스크립트

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/test-reports"
COVERAGE_DIR="$ROOT_DIR/coverage-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DOA Market 전체 서비스 테스트 실행${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 디렉토리 생성
mkdir -p "$REPORT_DIR"
mkdir -p "$COVERAGE_DIR"

# 서비스 목록
SERVICES=(
  "api-gateway"
  "auth-service"
  "user-service"
  "product-service"
  "order-service"
  "payment-service"
  "shipping-service"
  "seller-service"
  "settlement-service"
  "coupon-service"
  "inventory-service"
  "notification-service"
  "review-service"
  "search-service"
  "admin-service"
  "file-service"
  "stats-service"
  "banner-service"
)

# 결과 저장 (bash 3.2 호환: 연관 배열 대신 일반 배열 사용)
TEST_RESULTS=()

# 결과 저장 함수 (bash 3.2 호환)
set_test_result() {
  local service="$1"
  local status="$2"
  TEST_RESULTS=("${TEST_RESULTS[@]}" "${service}:${status}")
}

# 결과 조회 함수 (bash 3.2 호환)
get_test_result() {
  local service="$1"
  local result="SKIP"
  for entry in "${TEST_RESULTS[@]}"; do
    if [ "${entry%%:*}" = "$service" ]; then
      result="${entry#*:}"
      break
    fi
  done
  echo "$result"
}

# 각 서비스 테스트 실행
for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="$ROOT_DIR/$SERVICE"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${YELLOW}⚠️  $SERVICE 디렉토리가 없습니다. 건너뜁니다.${NC}"
    continue
  fi

  if [ ! -f "$SERVICE_DIR/package.json" ]; then
    echo -e "${YELLOW}⚠️  $SERVICE에 package.json이 없습니다. 건너뜁니다.${NC}"
    continue
  fi

  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}테스트 실행: $SERVICE${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  cd "$SERVICE_DIR"

  # Jest 설정 확인
  if [ ! -f "jest.config.js" ] && [ ! -f "jest.config.ts" ]; then
    echo -e "${YELLOW}⚠️  Jest 설정이 없습니다. 기본 설정을 생성합니다.${NC}"
    # Jest 설정 파일 생성은 별도로 처리
  fi

  # 테스트 실행
  if npm run test:coverage 2>&1 | tee "$REPORT_DIR/${SERVICE}_test_${TIMESTAMP}.log"; then
    set_test_result "$SERVICE" "PASS"
    echo -e "${GREEN}✅ $SERVICE 테스트 통과${NC}"
  else
    set_test_result "$SERVICE" "FAIL"
    echo -e "${RED}❌ $SERVICE 테스트 실패${NC}"
  fi

  # 커버리지 리포트 복사
  if [ -d "$SERVICE_DIR/coverage" ]; then
    cp -r "$SERVICE_DIR/coverage" "$COVERAGE_DIR/${SERVICE}_coverage"
    echo -e "${GREEN}📊 커버리지 리포트 저장: $COVERAGE_DIR/${SERVICE}_coverage${NC}"
  fi

  echo ""
done

# 결과 요약 리포트 생성
SUMMARY_FILE="$REPORT_DIR/test_summary_${TIMESTAMP}.md"
cat > "$SUMMARY_FILE" << EOF
# DOA Market 테스트 결과 요약

**실행 시간**: $(date)
**타임스탬프**: $TIMESTAMP

## 테스트 결과

| 서비스 | 상태 | 커버리지 |
|--------|------|----------|
EOF

for SERVICE in "${SERVICES[@]}"; do
  STATUS=$(get_test_result "$SERVICE")
  if [ "$STATUS" = "PASS" ]; then
    STATUS_ICON="✅"
  elif [ "$STATUS" = "FAIL" ]; then
    STATUS_ICON="❌"
  else
    STATUS_ICON="⏭️"
  fi
  
  COVERAGE_FILE="$COVERAGE_DIR/${SERVICE}_coverage/lcov-report/index.html"
  if [ -f "$COVERAGE_FILE" ]; then
    COVERAGE_INFO="[보고서]($COVERAGE_FILE)"
  else
    COVERAGE_INFO="N/A"
  fi
  
  echo "| $SERVICE | $STATUS_ICON $STATUS | $COVERAGE_INFO |" >> "$SUMMARY_FILE"
done

cat >> "$SUMMARY_FILE" << EOF

## 상세 로그

각 서비스의 상세 테스트 로그는 다음 파일에서 확인할 수 있습니다:
- \`$REPORT_DIR/${SERVICE}_test_${TIMESTAMP}.log\`

## 커버리지 리포트

각 서비스의 커버리지 리포트는 다음 디렉토리에서 확인할 수 있습니다:
- \`$COVERAGE_DIR/\`

## 다음 단계

1. 실패한 테스트 확인 및 수정
2. 커버리지 리포트 검토
3. 개선이 필요한 서비스 식별
EOF

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}테스트 실행 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📄 요약 리포트: $SUMMARY_FILE${NC}"
echo -e "${GREEN}📊 커버리지 리포트: $COVERAGE_DIR${NC}"
echo ""

# 결과 요약 출력
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for SERVICE in "${SERVICES[@]}"; do
  STATUS=$(get_test_result "$SERVICE")
  if [ "$STATUS" = "PASS" ]; then
    ((PASS_COUNT++))
  elif [ "$STATUS" = "FAIL" ]; then
    ((FAIL_COUNT++))
  else
    ((SKIP_COUNT++))
  fi
done

echo -e "${GREEN}✅ 통과: $PASS_COUNT${NC}"
echo -e "${RED}❌ 실패: $FAIL_COUNT${NC}"
echo -e "${YELLOW}⏭️  건너뜀: $SKIP_COUNT${NC}"

