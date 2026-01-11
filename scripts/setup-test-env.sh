#!/bin/bash

# 테스트 환경 설정 스크립트
# 모든 서비스에 필요한 의존성을 설치합니다

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}테스트 환경 설정${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

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

  echo -e "${GREEN}설치 중: $SERVICE${NC}"
  cd "$SERVICE_DIR"
  
  if [ ! -d "node_modules" ]; then
    npm install
  else
    echo -e "  ✓ node_modules가 이미 존재합니다."
  fi
  
  echo ""
done

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}설정 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

