# CI/CD Quick Start Guide

빠르게 CI/CD를 시작하는 가이드입니다.

## 5분 만에 시작하기

### 1. AWS 설정 (10분)

```bash
# EKS 클러스터 생성
eksctl create cluster --name doa-market --region ap-northeast-2

# ECR 레포지토리 일괄 생성
./scripts/create-ecr-repos.sh
```

### 2. GitHub Secrets 추가 (2분)

GitHub 레포 → Settings → Secrets → New repository secret

```
AWS_ACCESS_KEY_ID=<YOUR_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
ECR_REGISTRY=123456789012.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 3. ArgoCD 설치 (5분)

```bash
# 설치
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 비밀번호 확인
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 접속
kubectl port-forward svc/argocd-server -n argocd 8080:443
# 브라우저: https://localhost:8080
```

### 4. Secrets 생성 (2분)

```bash
# Namespace 생성
kubectl create namespace doa-market-prod

# DB Secret
kubectl create secret generic db-credentials-prod \
  --from-literal=username=admin \
  --from-literal=password=your-db-password \
  -n doa-market-prod

# Redis Secret
kubectl create secret generic redis-credentials-prod \
  --from-literal=password=your-redis-password \
  -n doa-market-prod

# RabbitMQ Secret
kubectl create secret generic rabbitmq-credentials-prod \
  --from-literal=username=admin \
  --from-literal=password=your-rabbitmq-password \
  -n doa-market-prod
```

### 5. Helm Values 수정 (1분)

`helm/doa-market/values-production.yaml` 파일에서:

```yaml
global:
  registry: 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com  # ← ECR 주소로 변경

database:
  host: your-rds-endpoint.rds.amazonaws.com  # ← RDS 주소로 변경
```

### 6. ArgoCD Application 배포 (1분)

```bash
kubectl apply -f argocd/applications/doa-market-production.yaml
```

### 7. 첫 배포 테스트 (1분)

```bash
# 코드 수정
echo "// test" >> product-service/src/index.ts

# 커밋 & 푸시
git add .
git commit -m "test: trigger CI/CD"
git push origin main

# GitHub Actions 확인
# https://github.com/DOA-Openmarket/doa-market-backend/actions

# ArgoCD 확인
# https://localhost:8080
```

---

## 일상적인 배포 워크플로우

### 새 기능 개발

```bash
# 1. 브랜치 생성
git checkout -b feature/new-api

# 2. 코드 작성
vim product-service/src/controllers/product.controller.ts

# 3. 로컬 테스트
cd product-service && npm test

# 4. 커밋 & PR
git add .
git commit -m "feat: add new product API"
git push origin feature/new-api

# 5. GitHub에서 PR 생성
# → 자동으로 PR Checks 실행 (테스트, 린트, 보안 스캔)

# 6. 리뷰 후 main 브랜치로 merge
# → 자동으로 CI/CD 파이프라인 실행
# → 3-5분 후 프로덕션 배포 완료
```

---

## 주요 명령어 치트시트

### ArgoCD

```bash
# 앱 상태 확인
argocd app get doa-market-production

# 수동 동기화
argocd app sync doa-market-production

# 롤백
argocd app rollback doa-market-production

# 히스토리 조회
argocd app history doa-market-production
```

### Kubernetes

```bash
# Pod 상태
kubectl get pods -n doa-market-prod

# 로그 확인
kubectl logs -f deployment/product-service -n doa-market-prod

# Pod 재시작
kubectl rollout restart deployment/product-service -n doa-market-prod

# HPA 상태
kubectl get hpa -n doa-market-prod

# 이벤트 확인
kubectl get events -n doa-market-prod --sort-by='.lastTimestamp'
```

### Docker (로컬 테스트)

```bash
# 이미지 빌드 테스트
docker build -f product-service/Dockerfile -t test-product-service .

# 로컬 실행
docker run -p 3002:3002 test-product-service
```

---

## 트러블슈팅

### Pod가 Pending 상태

```bash
kubectl describe pod <POD_NAME> -n doa-market-prod
# → Events 섹션에서 원인 확인 (리소스 부족, PVC 문제 등)
```

### 이미지 Pull 실패

```bash
# ECR 로그인 테스트
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ECR_REGISTRY>
```

### ArgoCD 동기화 안됨

```bash
# 수동 리프레시
argocd app get doa-market-production --refresh --hard
```

---

## 다음 단계

1. **모니터링 설정**: Prometheus + Grafana 연동
2. **로깅 중앙화**: EFK (Elasticsearch + Fluentd + Kibana) 스택
3. **알림 설정**: ArgoCD Slack 알림, PagerDuty 연동
4. **성능 테스트**: K6 또는 Locust로 부하 테스트
5. **비용 최적화**: Spot Instances, Cluster Autoscaler

자세한 내용은 [CICD_SETUP.md](./CICD_SETUP.md)를 참고하세요.
