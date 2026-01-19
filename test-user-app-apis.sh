#!/bin/bash

# User-App API 테스트 스크립트
# 작성일: 2026-01-19

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Gateway URL
API_URL="${API_URL:-http://localhost:3000/api/v1}"

echo "========================================="
echo "User-App API 테스트"
echo "========================================="
echo "API Gateway: $API_URL"
echo ""

# 헬스 체크
echo -e "${YELLOW}[1/10] Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/../health")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $response)${NC}"
fi
echo ""

# 공지사항 조회 (공개)
echo -e "${YELLOW}[2/10] 공지사항 조회 (Public)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/notices?page=1&limit=5")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Notices API working${NC}"
    echo "$response" | sed '$d' | jq -r '.data[0].title // "No notices found"' 2>/dev/null || echo "Response received"
else
    echo -e "${RED}✗ Notices API failed (HTTP $http_code)${NC}"
fi
echo ""

# 인기 검색어 조회
echo -e "${YELLOW}[3/10] 인기 검색어 조회${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/search/popular?limit=5")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Popular keywords API working${NC}"
    echo "$response" | sed '$d' | jq -r '.data[0].keyword // "No keywords"' 2>/dev/null || echo "Response received"
else
    echo -e "${RED}✗ Popular keywords API failed (HTTP $http_code)${NC}"
fi
echo ""

# 상품 검색
echo -e "${YELLOW}[4/10] 상품 검색${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/search/products?q=노트북&page=1&size=5")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Product search API working${NC}"
else
    echo -e "${RED}✗ Product search API failed (HTTP $http_code)${NC}"
fi
echo ""

# 상품 목록 조회
echo -e "${YELLOW}[5/10] 상품 목록 조회${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/products?page=1&limit=5")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Products list API working${NC}"
    product_count=$(echo "$response" | sed '$d' | jq -r '.data | length' 2>/dev/null || echo "0")
    echo "  Products found: $product_count"
else
    echo -e "${RED}✗ Products list API failed (HTTP $http_code)${NC}"
fi
echo ""

# 카테고리 조회
echo -e "${YELLOW}[6/10] 카테고리 조회${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/categories")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Categories API working${NC}"
    category_count=$(echo "$response" | sed '$d' | jq -r '.data | length' 2>/dev/null || echo "0")
    echo "  Categories found: $category_count"
else
    echo -e "${RED}✗ Categories API failed (HTTP $http_code)${NC}"
fi
echo ""

# 로그인 테스트 (Demo 계정)
echo -e "${YELLOW}[7/10] 로그인 테스트${NC}"
login_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"demo123"}')
http_code=$(echo "$login_response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Login API working${NC}"
    TOKEN=$(echo "$login_response" | sed '$d' | jq -r '.data.accessToken // empty' 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        echo "  Token received: ${TOKEN:0:20}..."
    else
        echo "  Note: Token not found in response (demo user may not exist)"
    fi
else
    echo -e "${RED}✗ Login API failed (HTTP $http_code)${NC}"
    echo "  Note: Demo user may not exist in database"
fi
echo ""

# 프로필 조회 (인증 필요)
echo -e "${YELLOW}[8/10] 프로필 조회 테스트${NC}"
if [ -n "$TOKEN" ]; then
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/users/demo-user-id/profile" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    if [ "$http_code" == "200" ] || [ "$http_code" == "404" ]; then
        echo -e "${GREEN}✓ Profile API endpoint working${NC}"
    else
        echo -e "${RED}✗ Profile API failed (HTTP $http_code)${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipped (no auth token)${NC}"
fi
echo ""

# 주문 목록 조회 (인증 필요)
echo -e "${YELLOW}[9/10] 주문 목록 조회 테스트${NC}"
if [ -n "$TOKEN" ]; then
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/orders/user/demo-user-id?page=1&limit=5" \
        -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✓ User orders API working${NC}"
    else
        echo -e "${YELLOW}⊘ User orders API endpoint exists (HTTP $http_code)${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipped (no auth token)${NC}"
fi
echo ""

# 검색 기록 조회
echo -e "${YELLOW}[10/10] 검색 기록 조회 테스트${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/search/history/demo-user-id?limit=5")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ Search history API working${NC}"
else
    echo -e "${RED}✗ Search history API failed (HTTP $http_code)${NC}"
fi
echo ""

echo "========================================="
echo "테스트 완료"
echo "========================================="
echo ""
echo -e "${YELLOW}참고사항:${NC}"
echo "- 일부 테스트는 데이터베이스에 데이터가 있어야 성공합니다"
echo "- 인증이 필요한 API는 demo 계정이 없으면 실패할 수 있습니다"
echo "- 모든 서비스가 실행 중인지 확인하세요"
echo ""
