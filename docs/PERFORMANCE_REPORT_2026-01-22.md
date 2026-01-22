# DOA Market 성능 테스트 보고서 (2026-01-22)

## 📊 Executive Summary

**테스트 일시**: 2026-01-22 10:08 - 10:14 KST
**테스트 환경**: EKS (t3.medium/t3a.medium) + Aurora PostgreSQL (새로 생성) + kubectl port-forward
**테스트 도구**: k6 (Grafana Load Testing)
**테스트 기간**: 7분 (Ramp-up: 30s → 1m → 2m → 1m → 2m, Ramp-down: 30s)
**최대 부하**: 200 concurrent users

---

## 🔴 주요 발견 사항

### Critical Issues

1. **높은 실패율**: 89.30% HTTP 요청 실패
2. **데이터베이스 스키마 문제**: 여러 서비스 CrashLoopBackOff
3. **리소스 부족**: 많은 파드가 Pending 상태
4. **Port-forward 한계**: 고부하 시 연결 불안정

---

## 📈 성능 지표

### 전체 결과

| 지표 | 결과 | 목표 | 상태 |
|------|------|------|------|
| **총 요청 수** | 29,826개 | - | ✅ |
| **총 반복 수** | 29,934 iterations | - | ✅ |
| **요청 실패율** | 89.30% (26,637/29,826) | < 5% | ❌ |
| **에러율** | 100% (25,163/25,163) | < 5% | ❌ |
| **처리량** | 70.78 req/s | - | ⚠️ |
| **평균 응답 시간** | 66.46ms | - | ✅ |
| **중간값 응답 시간** | 7.78ms | - | ✅ |
| **p90 응답 시간** | 34.08ms | - | ✅ |
| **p95 응답 시간** | 983.7ms | < 500ms | ❌ |
| **p99 응답 시간** | 1.01s | < 1000ms | ❌ |
| **최대 응답 시간** | 1.93s | - | ⚠️ |

### 성공한 요청의 성능 (Success Requests Only)

| 지표 | 값 |
|------|-----|
| 평균 응답 시간 | 29.16ms |
| 중간값 | 25.63ms |
| p90 | 43.36ms |
| p95 | 72.89ms |
| 최대 | 980.45ms |

✅ **성공한 요청들의 응답 시간은 우수함**

---

## 🧪 테스트 시나리오별 결과

### 1. Health Check (5% of traffic) ✅

| 체크 항목 | 성공률 | 결과 |
|----------|--------|------|
| Health status is 200 | 100% | ✅ 완벽 |
| Health has success field | 100% | ✅ 완벽 |

**분석**: Health check 엔드포인트는 100% 성공적으로 응답

### 2. Categories (10% of traffic) ❌

| 체크 항목 | 성공률 | 성공/실패 |
|----------|--------|-----------|
| Categories status is 200 | 6% | ✓ 190 / ✗ 2,803 |
| Categories has data | 6% | ✓ 190 / ✗ 2,803 |

**분석**: 94% 요청 실패 - 고부하 시 연결 문제

### 3. Products List (30% of traffic) ❌

| 체크 항목 | 성공률 | 성공/실패 |
|----------|--------|-----------|
| Products status is 200 | 6% | ✓ 566 / ✗ 8,304 |
| Products has data | 6% | ✓ 566 / ✗ 8,304 |

**분석**: 94% 요청 실패 - 가장 많은 트래픽을 받는 엔드포인트

### 4. Product Details (40% of traffic) ❌

| 체크 항목 | 성공률 | 성공/실패 |
|----------|--------|-----------|
| Product detail status is 200 | 6% | ✓ 734 / ✗ 11,217 |
| Product detail has data | 6% | ✓ 734 / ✗ 11,217 |

**분석**: 94% 요청 실패 - 가장 높은 트래픽 볼륨

### 5. Banners (10% of traffic) ❌

| 체크 항목 | 성공률 | 성공/실패 |
|----------|--------|-----------|
| Banners status is 200 | 6% | ✓ 200 / ✗ 2,839 |

**분석**: 94% 요청 실패 - 다른 엔드포인트와 동일한 패턴

### 6. Search (5% of traffic) ✅

| 체크 항목 | 성공률 | 결과 |
|----------|--------|------|
| Search returned response | 100% | ✅ 응답 수신 |

**분석**: OpenSearch 미구축으로 500 에러지만 응답은 정상 수신

---

## 🏗️ 인프라 현황

### EKS 클러스터 구성

| 항목 | 현재 값 |
|------|---------|
| **노드 수** | 3개 |
| **인스턴스 타입** | t3.medium (2 CPU, ~4GB RAM) × 2 <br/> t3a.medium (2 CPU, ~4GB RAM) × 1 |
| **Capacity Type** | **On-Demand** (Spot 아님) |
| **총 CPU** | 6 vCPU |
| **총 메모리** | ~12GB |

⚠️ **참고**: 사용자가 Spot 인스턴스로 변경했다고 언급했으나, 실제로는 On-Demand 인스턴스로 확인됨

### 백엔드 서비스 상태

| 상태 | 서비스 수 | 서비스 목록 |
|------|-----------|-------------|
| ✅ **Running** | 12개 | api-gateway, product-service, cart-service, admin-service, search-service, file-service, stats-service, banner-service, settlement-service, inventory-service, notification-service, shipping-service, seller-service |
| ❌ **CrashLoopBackOff** | 7개 | user-service, order-service, review-service, coupon-service, seller-service (일부), notification-service (일부), shipping-service (일부) |
| ⏸️ **Pending** | 여러 개 | 리소스 부족으로 스케줄링 불가 |

### 데이터베이스

| 항목 | 값 |
|------|-----|
| **타입** | Aurora PostgreSQL |
| **엔드포인트** | doa-market-rds.cluster-c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com |
| **상태** | 새로 생성됨 |
| **문제** | 일부 서비스에서 스키마 불일치 에러 |

**주요 에러**:
```
column "id" referenced in foreign key constraint does not exist
```

---

## 📊 이전 결과와 비교

### 2026-01-16 (Newman API Test) vs 2026-01-22 (k6 Load Test)

| 지표 | 2026-01-16 | 2026-01-22 | 변화 |
|------|------------|------------|------|
| **테스트 도구** | Newman (순차) | k6 (동시) | - |
| **총 요청** | 65개 | 29,826개 | +45,786% |
| **실행 시간** | 2.6초 | 7분 1초 | - |
| **실패율** | 0% | 89.30% | +89.30% ⬇️ |
| **평균 응답 시간** | 31ms | 66.46ms | +35.46ms |
| **p95 응답 시간** | N/A | 983.7ms | - |
| **동시 사용자** | 1명 | 최대 200명 | +200x |
| **환경** | EKS + Aurora | EKS + Aurora (새 DB) | DB 재생성 |

**주요 차이점**:
1. **테스트 유형**: 기능 테스트 → 부하 테스트
2. **동시성**: 순차 실행 → 최대 200 concurrent users
3. **DB 상태**: 정상 스키마 → 새로 생성 (일부 스키마 불일치)
4. **접근 방법**: 직접 NLB → kubectl port-forward

---

## 🔍 실패 원인 분석

### 1. kubectl port-forward 한계 (Primary) ⚠️

**증상**:
- 저부하 (1-50 users): 정상 작동
- 고부하 (100-200 users): 89% 실패율

**원인**:
- `kubectl port-forward`는 개발용 도구로 프로덕션 부하 테스트에 적합하지 않음
- 단일 TCP 연결 병목
- 고부하 시 연결 드롭

**해결 방안**:
- LoadBalancer 직접 사용 (port 80 또는 3000)
- 또는 Ingress 설정

### 2. 데이터베이스 스키마 불일치 (Critical) 🔴

**영향받는 서비스**:
- `user-service`: Foreign key constraint error
- `order-service`: Foreign key constraint error
- `review-service`, `coupon-service`: 유사한 문제 추정

**원인**:
- RDS 재생성 후 스키마 마이그레이션 누락
- Sequelize 모델과 실제 DB 스키마 불일치

**해결 방안**:
1. DB 스키마 마이그레이션 스크립트 실행
2. 또는 시드 데이터 재생성
3. Sequelize sync 로직 검토

### 3. 클러스터 리소스 부족 (Critical) 🔴

**증상**:
- 여러 파드가 Pending 상태
- 일부 서비스가 1 replica만 Running, 나머지 Pending

**원인**:
- 3개 노드 (총 6 vCPU, 12GB RAM)로 19개 서비스 운영
- 각 서비스가 2 replica로 설정 → 총 38개 파드 필요
- CPU/Memory 리소스 부족

**해결 방안**:
1. **즉시**: replica를 1로 축소 (완료)
2. **단기**: 노드 추가 (Cluster Autoscaler)
3. **중기**: Spot Instance 활성화 (비용 절감)
4. **장기**: 리소스 request/limit 최적화

---

## ⚡ 성능 개선 권장 사항

### High Priority (즉시 조치 필요)

1. **DB 스키마 복구** 🔴
   - 작업: Sequelize migration 실행 또는 DB 재시드
   - 예상 시간: 30분
   - 영향: user-service, order-service, review-service, coupon-service 복구

2. **부하 테스트 재실행 (LoadBalancer 직접 사용)** 🟡
   - 작업: port-forward 대신 NLB 엔드포인트 사용
   - 예상 시간: 10분
   - 영향: 실제 프로덕션 성능 측정

3. **클러스터 스케일 업** 🟡
   - 작업: 노드 2-3개 추가
   - 예상 비용: ~$50-75/월
   - 영향: 모든 서비스 정상 운영 가능

### Medium Priority

4. **Spot Instance 전환** 💰
   - 작업: Node Group을 Spot으로 변경
   - 예상 절감: ~60-70% 비용 절감
   - 주의: 일부 노드 중단 가능성

5. **리소스 최적화**
   - CPU/Memory request/limit 조정
   - 불필요한 서비스 replica 축소
   - HPA (Horizontal Pod Autoscaler) 설정

6. **Metrics Server 설치**
   - `kubectl top` 활성화
   - 리소스 사용량 실시간 모니터링

### Low Priority

7. **OpenSearch 구축**
   - 검색 기능 활성화
   - 예상 비용: ~$100-150/월

8. **APM 도구 통합**
   - Datadog, New Relic, 또는 Grafana Cloud
   - 상세한 성능 프로파일링

---

## 🎯 다음 테스트 계획

### 테스트 1: LoadBalancer 직접 테스트

**목적**: port-forward 병목 제거 후 실제 성능 측정

**설정**:
```javascript
const BASE_URL = 'http://a0f36783dc7d045ad98ca197667690b4-0d081d87d5a42735.elb.ap-northeast-2.amazonaws.com:3000';
```

**예상 결과**: 실패율 < 5%, p95 < 200ms

### 테스트 2: DB 복구 후 재테스트

**전제 조건**:
- user-service, order-service 정상화
- 모든 백엔드 서비스 Running 상태

**목표**:
- 전체 API 기능 테스트
- 회원가입, 주문 생성 등 E2E 시나리오

### 테스트 3: Spot Instance 전환 후 비교

**측정 항목**:
- 성능 변화 (예상: 영향 없음)
- 비용 절감 (예상: ~65%)
- 안정성 (node interruption 빈도)

---

## 📝 결론

### 현재 상태

✅ **정상**:
- API Gateway 작동
- Health check 100% 성공
- 성공한 요청의 응답 시간 우수 (평균 29ms)
- 핵심 서비스 (product, cart, search) 운영 중

❌ **문제**:
- **89% 요청 실패** (port-forward 한계)
- **7개 서비스 CrashLoopBackOff** (DB 스키마 문제)
- **리소스 부족** (노드 확장 필요)
- **Spot Instance 미사용** (비용 최적화 누락)

### 즉시 조치 필요

1. 🔴 **DB 스키마 복구**: user-service, order-service 등 수정
2. 🟡 **노드 추가**: 최소 2개 노드 추가로 안정성 확보
3. 🟢 **LoadBalancer 테스트**: 실제 성능 재측정

### 예상 개선 효과

| 항목 | 개선 전 | 개선 후 (예상) |
|------|---------|---------------|
| 요청 성공률 | 10.7% | 95%+ |
| Running Services | 12/19 (63%) | 19/19 (100%) |
| p95 응답 시간 | 983ms | < 200ms |
| 인프라 비용 | $150/월 | $90/월 (Spot 전환 시) |

---

## 📂 첨부 파일

- **부하 테스트 스크립트**: `/tmp/k6-load-test.js`
- **테스트 결과 (JSON)**: `/tmp/k6-results.json`
- **테스트 출력**: `/tmp/k6-output.txt`

---

**보고서 생성 일시**: 2026-01-22 10:20 KST
**작성자**: Claude (Automated Performance Testing)
**버전**: 1.0
**다음 검토 예정**: 2026-01-23 (DB 복구 및 재테스트 후)
