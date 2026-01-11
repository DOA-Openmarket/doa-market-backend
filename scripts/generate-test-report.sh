#!/usr/bin/env bash

# 테스트 실행 및 HTML 보고서 생성 스크립트
# Bash 4+ 연관 배열을 사용하므로 bash 4+ 필요

set -e

# Bash 버전 확인 및 업그레이드 안내
if [ -z "$BASH_VERSION" ]; then
  echo "Error: This script must be run with bash"
  exit 1
fi

BASH_MAJOR_VERSION="${BASH_VERSION%%.*}"
if [ "$BASH_MAJOR_VERSION" -lt 4 ]; then
  echo "Warning: Bash version $BASH_VERSION detected. This script requires Bash 4+"
  echo "Please install bash 4+ with: brew install bash"
  echo "Then run this script with: /usr/local/bin/bash $0"
  echo ""
  echo "Alternatively, you can use the simplified version without associative arrays."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/test-reports"
COVERAGE_DIR="$ROOT_DIR/coverage-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HTML_REPORT="$REPORT_DIR/test-report-${TIMESTAMP}.html"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DOA Market 테스트 보고서 생성${NC}"
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

# 결과 저장 (Bash 4+ 연관 배열)
declare -A TEST_RESULTS
declare -A COVERAGE_PERCENTAGES
declare -A TEST_COUNTS

# HTML 보고서 시작
cat > "$HTML_REPORT" << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOA Market 테스트 보고서</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.pass {
            background-color: #d4edda;
            color: #155724;
        }
        .summary-card.fail {
            background-color: #f8d7da;
            color: #721c24;
        }
        .summary-card.skip {
            background-color: #fff3cd;
            color: #856404;
        }
        .summary-card h3 {
            margin: 0;
            font-size: 2em;
        }
        .summary-card p {
            margin: 10px 0 0 0;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .status-pass {
            color: #28a745;
            font-weight: bold;
        }
        .status-fail {
            color: #dc3545;
            font-weight: bold;
        }
        .status-skip {
            color: #ffc107;
            font-weight: bold;
        }
        .coverage-high {
            color: #28a745;
        }
        .coverage-medium {
            color: #ffc107;
        }
        .coverage-low {
            color: #dc3545;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DOA Market 테스트 보고서</h1>
        <p><strong>생성 시간:</strong> <span id="timestamp"></span></p>
        
        <div class="summary">
            <div class="summary-card pass">
                <h3 id="pass-count">0</h3>
                <p>통과</p>
            </div>
            <div class="summary-card fail">
                <h3 id="fail-count">0</h3>
                <p>실패</p>
            </div>
            <div class="summary-card skip">
                <h3 id="skip-count">0</h3>
                <p>건너뜀</p>
            </div>
        </div>
        
        <h2>서비스별 테스트 결과</h2>
        <table>
            <thead>
                <tr>
                    <th>서비스</th>
                    <th>상태</th>
                    <th>테스트 수</th>
                    <th>커버리지</th>
                    <th>상세</th>
                </tr>
            </thead>
            <tbody id="results-table">
            </tbody>
        </table>
        
        <div class="footer">
            <p>DOA Market Backend Services Test Report</p>
        </div>
    </div>
    
    <script>
        // 데이터는 아래에 삽입됩니다
    </script>
</body>
</html>
EOF

# 각 서비스 테스트 실행
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for SERVICE in "${SERVICES[@]}"; do
  SERVICE_DIR="$ROOT_DIR/$SERVICE"
  
  if [ ! -d "$SERVICE_DIR" ]; then
    TEST_RESULTS["$SERVICE"]="SKIP"
    TEST_COUNTS["$SERVICE"]="0"
    COVERAGE_PERCENTAGES["$SERVICE"]="N/A"
    ((SKIP_COUNT++))
    continue
  fi

  if [ ! -f "$SERVICE_DIR/package.json" ]; then
    TEST_RESULTS["$SERVICE"]="SKIP"
    TEST_COUNTS["$SERVICE"]="0"
    COVERAGE_PERCENTAGES["$SERVICE"]="N/A"
    ((SKIP_COUNT++))
    continue
  fi

  cd "$SERVICE_DIR"

  # Jest 설정 확인
  if [ ! -f "jest.config.js" ] && [ ! -f "jest.config.ts" ]; then
    TEST_RESULTS["$SERVICE"]="SKIP"
    TEST_COUNTS["$SERVICE"]="0"
    COVERAGE_PERCENTAGES["$SERVICE"]="N/A"
    ((SKIP_COUNT++))
    continue
  fi

  # 테스트 실행
  if npm run test:coverage 2>&1 | tee "$REPORT_DIR/${SERVICE}_test_${TIMESTAMP}.log"; then
    TEST_RESULTS["$SERVICE"]="PASS"
    ((PASS_COUNT++))
    
    # 테스트 수 추출
    TEST_COUNT=$(grep -oP 'Tests:\s+\K\d+' "$REPORT_DIR/${SERVICE}_test_${TIMESTAMP}.log" | head -1 || echo "0")
    TEST_COUNTS["$SERVICE"]="${TEST_COUNT:-0}"
    
    # 커버리지 추출
    COVERAGE=$(grep -oP 'All files\s+\|\s+\K[\d.]+' "$REPORT_DIR/${SERVICE}_test_${TIMESTAMP}.log" | head -1 || echo "N/A")
    COVERAGE_PERCENTAGES["$SERVICE"]="${COVERAGE:-N/A}"
  else
    TEST_RESULTS["$SERVICE"]="FAIL"
    ((FAIL_COUNT++))
    TEST_COUNTS["$SERVICE"]="0"
    COVERAGE_PERCENTAGES["$SERVICE"]="N/A"
  fi

  # 커버리지 리포트 복사
  if [ -d "$SERVICE_DIR/coverage" ]; then
    cp -r "$SERVICE_DIR/coverage" "$COVERAGE_DIR/${SERVICE}_coverage" 2>/dev/null || true
  fi
done

# HTML 보고서에 데이터 삽입
TIMESTAMP_STR=$(date '+%Y-%m-%d %H:%M:%S')
sed -i.bak "s|<span id=\"timestamp\"></span>|$TIMESTAMP_STR|g" "$HTML_REPORT"
sed -i.bak "s|<h3 id=\"pass-count\">0</h3>|<h3 id=\"pass-count\">$PASS_COUNT</h3>|g" "$HTML_REPORT"
sed -i.bak "s|<h3 id=\"fail-count\">0</h3>|<h3 id=\"fail-count\">$FAIL_COUNT</h3>|g" "$HTML_REPORT"
sed -i.bak "s|<h3 id=\"skip-count\">0</h3>|<h3 id=\"skip-count\">$SKIP_COUNT</h3>|g" "$HTML_REPORT"

# 테이블 데이터 생성
TABLE_ROWS=""
for SERVICE in "${SERVICES[@]}"; do
  STATUS="${TEST_RESULTS[$SERVICE]:-SKIP}"
  TEST_COUNT="${TEST_COUNTS[$SERVICE]:-0}"
  COVERAGE="${COVERAGE_PERCENTAGES[$SERVICE]:-N/A}"
  
  if [ "$STATUS" = "PASS" ]; then
    STATUS_CLASS="status-pass"
    STATUS_TEXT="✅ 통과"
  elif [ "$STATUS" = "FAIL" ]; then
    STATUS_CLASS="status-fail"
    STATUS_TEXT="❌ 실패"
  else
    STATUS_CLASS="status-skip"
    STATUS_TEXT="⏭️ 건너뜀"
  fi
  
  # 커버리지 색상 클래스
  if [ "$COVERAGE" != "N/A" ]; then
    COVERAGE_NUM=$(echo "$COVERAGE" | sed 's/%//' | sed 's/\..*//')
    if [ -n "$COVERAGE_NUM" ] && [ "$COVERAGE_NUM" -ge 80 ] 2>/dev/null; then
      COVERAGE_CLASS="coverage-high"
    elif [ -n "$COVERAGE_NUM" ] && [ "$COVERAGE_NUM" -ge 50 ] 2>/dev/null; then
      COVERAGE_CLASS="coverage-medium"
    else
      COVERAGE_CLASS="coverage-low"
    fi
  else
    COVERAGE_CLASS=""
  fi
  
  COVERAGE_LINK=""
  if [ -f "$COVERAGE_DIR/${SERVICE}_coverage/lcov-report/index.html" ]; then
    COVERAGE_LINK="<a href=\"../coverage-reports/${SERVICE}_coverage/lcov-report/index.html\" target=\"_blank\">보고서 보기</a>"
  fi
  
  TABLE_ROWS+="<tr>
    <td><strong>$SERVICE</strong></td>
    <td class=\"$STATUS_CLASS\">$STATUS_TEXT</td>
    <td>$TEST_COUNT</td>
    <td class=\"$COVERAGE_CLASS\">$COVERAGE</td>
    <td>$COVERAGE_LINK</td>
  </tr>"
done

# 테이블에 데이터 삽입
sed -i.bak "s|<tbody id=\"results-table\">|<tbody id=\"results-table\">$TABLE_ROWS|g" "$HTML_REPORT"
rm -f "$HTML_REPORT.bak"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}테스트 보고서 생성 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📄 HTML 보고서: $HTML_REPORT${NC}"
echo -e "${BLUE}📊 커버리지 리포트: $COVERAGE_DIR${NC}"
echo ""
echo -e "${GREEN}✅ 통과: $PASS_COUNT${NC}"
echo -e "${RED}❌ 실패: $FAIL_COUNT${NC}"
echo -e "${YELLOW}⏭️  건너뜀: $SKIP_COUNT${NC}"

