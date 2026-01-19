# EKS 배포 상태 보고서

**작성일**: 2026-01-19
**환경**: EKS Production (doa-market-prod)

## 📊 현재 상황

### ✅ 완료된 작업

1. **Kubernetes Secrets 생성**
   - db-credentials-prod (테스트용)
   - redis-credentials-prod (테스트용)
   - rabbitmq-credentials-prod (테스트용)

2. **Dockerfile 수정**
   - api-gateway, order-service, search-service, user-service
   - 모노레포 빌드 컨텍스트에 맞게 수정
   - 커밋 SHA: `6eb737d`

3. **코드 변경사항 푸시**
   - 새로운 API 엔드포인트 추가
   - 커밋 SHA: `c058140`, `6eb737d`

4. **GitHub Actions 워크플로우 트리거**
   - CI/CD 파이프라인 실행됨

### ⚠️ 현재 문제

**이미지 Pull 정책 문제**

- **증상**: Pod가 새로운 이미지를 사용하지 않음
- **원인**: `imagePullPolicy: IfNotPresent`로 설정되어 있어 `latest` 태그의 새 이미지를 pull하지 않음
- **영향받는 서비스**: api-gateway, search-service, order-service, user-service

**테스트 결과**:
```bash
# 실패하는 API
- GET /api/v1/notices → 404 (Route not found)
- GET /api/v1/search/popular → 404 (Cannot GET)
- GET /api/v1/search/history/:userId → 404

# 성공하는 API
- GET /health → 200 OK (API Gateway 정상)
- GET /api/v1/products → 502 (서비스 크래시, DB 인증 문제)
- GET /api/v1/categories → 502 (서비스 크래시, DB 인증 문제)
```

### 🔴 추가 문제

**데이터베이스 인증 실패**

대부분의 서비스가 다음 에러로 크래시:
```
password authentication failed for user "postgres"
```

**영향받는 서비스**:
- product-service
- order-service
- user-service
- auth-service
- admin-service
- 기타 대부분의 백엔드 서비스

**정상 작동 서비스**:
- api-gateway ✅
- search-service ✅ (DB 불필요)
- file-service ✅

---

## 🔧 해결 방안

### 1. 이미지 Pull 정책 수정 (즉시 해결 가능)

**방법 A: Helm values 수정**
```yaml
# helm/doa-market/values-production.yaml
defaults:
  image:
    pullPolicy: Always  # IfNotPresent → Always로 변경
```

**방법 B: GitHub Actions에서 커밋 SHA 태그 사용**
이미 설정되어 있지만, Helm이 `latest` 태그를 사용하고 있음.

**방법 C: 수동으로 특정 이미지 태그 강제 적용**
```bash
# 최신 빌드의 이미지 SHA 확인
IMAGE_TAG="6eb737d"  # 또는 최신 커밋 SHA

# Deployment 이미지 업데이트
kubectl set image deployment/api-gateway \
  api-gateway=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-api-gateway:$IMAGE_TAG \
  -n default

kubectl set image deployment/search-service \
  search-service=478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-search-service:$IMAGE_TAG \
  -n default
```

### 2. 데이터베이스 자격증명 수정 (중요)

**현재 Secret에 설정된 값** (테스트용):
```
username: postgres
password: testpassword123
```

**실제 RDS 자격증명으로 교체 필요**:
```bash
kubectl delete secret db-credentials-prod -n default

kubectl create secret generic db-credentials-prod \
  --from-literal=username=<실제_RDS_사용자명> \
  --from-literal=password=<실제_RDS_비밀번호> \
  -n default

# 모든 Pod 재시작
kubectl rollout restart deployment -n default
```

### 3. GitHub Actions Workflow Dispatch (권장)

직접 workflow를 트리거하여 특정 서비스만 빌드:

```bash
# GitHub Actions에서 수동 실행
# 1. https://github.com/DOA-Openmarket/doa-market-backend/actions 접속
# 2. "CI - Build and Push to ECR" 워크플로우 선택
# 3. "Run workflow" 클릭
# 4. target_services에 입력:
#    ["api-gateway", "search-service", "order-service", "user-service"]
```

---

## 📝 권장 조치 순서

1. **DB 자격증명 업데이트** (최우선)
   - 실제 RDS 비밀번호로 Secret 교체
   - 모든 서비스가 정상적으로 시작될 수 있도록

2. **이미지 태그 명시적 지정**
   - GitHub Actions가 빌드한 커밋 SHA 태그 사용
   - 또는 Helm values에서 imagePullPolicy를 Always로 변경

3. **서비스 재배포**
   ```bash
   kubectl rollout restart deployment -n default
   ```

4. **API 테스트 재실행**
   ```bash
   API_URL="http://localhost:8080/api/v1" \
   bash /Users/krystal/workspace/doa-market/backend/test-user-app-apis.sh
   ```

---

## 🌐 외부 접속 설정

현재 모든 서비스가 `ClusterIP`로 설정되어 있어 외부에서 접속 불가능합니다.

**Ingress 또는 LoadBalancer 설정 필요**:

```yaml
# API Gateway를 LoadBalancer로 노출
kubectl patch svc api-gateway -n default -p '{"spec": {"type": "LoadBalancer"}}'

# 또는 Ingress 설정 (ALB)
# helm/doa-market/values-production.yaml에서 ingress.enabled: true 이미 설정됨
```

현재 Helm 릴리스가 없는 상태이므로 Helm 차트 배포 필요:
```bash
cd /Users/krystal/workspace/doa-market/backend/helm

helm install doa-market ./doa-market \
  -f doa-market/values-production.yaml \
  -n default
```

---

## 📊 Pod 상태 요약

| 서비스 | 상태 | 이슈 |
|--------|------|------|
| api-gateway | ✅ Running | 이전 코드 사용 중 |
| search-service | ✅ Running | 이전 코드 사용 중 |
| file-service | ✅ Running | - |
| product-service | ❌ CrashLoopBackOff | DB 인증 실패 |
| order-service | ❌ CrashLoopBackOff | DB 인증 실패 |
| user-service | ❌ CrashLoopBackOff | DB 인증 실패 |
| auth-service | ❌ CrashLoopBackOff | DB 인증 실패 |
| admin-service | ❌ CrashLoopBackOff | DB 인증 실패 |
| 기타 서비스 | ❌ CrashLoopBackOff | DB 인증 실패 |

---

## 🔗 유용한 링크

- **GitHub Actions**: https://github.com/DOA-Openmarket/doa-market-backend/actions
- **ECR Repository**: 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com
- **EKS Cluster**: arn:aws:eks:ap-northeast-2:478266318018:cluster/doa-market-prod

---

**다음 단계**: 실제 RDS 자격증명을 제공받아 Secret을 업데이트하고 모든 서비스를 재시작해야 합니다.
