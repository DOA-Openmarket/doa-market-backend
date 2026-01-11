# CI/CD Setup Guide

DOA Market 마이크로서비스를 위한 EKS CI/CD 파이프라인 구성 가이드입니다.

## 아키텍처 개요

```
GitHub Push → GitHub Actions → ECR → ArgoCD → EKS
     ↓              ↓              ↓       ↓
  Source        Build/Test     Image    Deploy
```

### 주요 특징

- ✅ **변경 감지**: 수정된 서비스만 선택적으로 빌드
- ✅ **GitOps**: ArgoCD를 통한 자동 배포
- ✅ **멀티 환경**: dev, staging, production 분리
- ✅ **자동 스케일링**: HPA로 트래픽 대응
- ✅ **보안**: Trivy 취약점 스캔, 최소 권한 원칙

---

## 1. 사전 준비

### 1.1 AWS 인프라 구성

```bash
# EKS 클러스터 생성 (eksctl 사용)
eksctl create cluster \
  --name doa-market-prod \
  --region ap-northeast-2 \
  --version 1.34 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed

# ECR 레포지토리 생성
services=(
  api-gateway auth-service product-service order-service payment-service
  user-service cart-service review-service notification-service search-service
  inventory-service seller-service admin-service file-service banner-service
  coupon-service shipping-service stats-service settlement-service
)

for service in "${services[@]}"; do
  aws ecr create-repository \
    --repository-name doa-market-${service} \
    --region ap-northeast-2 \
    --image-scanning-configuration scanOnPush=true
done
```

### 1.2 GitHub Secrets 설정

GitHub 레포지토리 Settings → Secrets and variables → Actions에서 다음 시크릿을 추가하세요:

```bash
AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_KEY>
ECR_REGISTRY=<ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com
SLACK_WEBHOOK_URL=<YOUR_SLACK_WEBHOOK>  # Optional
```

### 1.3 ArgoCD 설치

```bash
# ArgoCD 설치
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD CLI 설치 (Mac)
brew install argocd

# Admin 비밀번호 조회
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 포트 포워딩으로 접속
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 로그인: https://localhost:8080
# ID: admin, PW: 위에서 조회한 비밀번호
```

### 1.4 Kubernetes Secrets 생성

```bash
# Namespace 생성
kubectl create namespace doa-market-prod

# 환경 변수 설정
export DB_PASSWORD="your-secure-db-password"
export REDIS_PASSWORD="your-secure-redis-password"
export RABBITMQ_PASSWORD="your-secure-rabbitmq-password"

# Database credentials
kubectl create secret generic db-credentials-prod \
  --from-literal=username=doa_user \
  --from-literal=password=$DB_PASSWORD \
  -n doa-market-prod

# Redis credentials
kubectl create secret generic redis-credentials-prod \
  --from-literal=password=$REDIS_PASSWORD \
  -n doa-market-prod

# RabbitMQ credentials
kubectl create secret generic rabbitmq-credentials-prod \
  --from-literal=username=doa_user \
  --from-literal=password=$RABBITMQ_PASSWORD \
  -n doa-market-prod
```

---

## 2. CI/CD 워크플로우

### 2.1 CI 파이프라인 (GitHub Actions)

#### 자동 트리거

- `main` 브랜치에 push → Production 이미지 빌드 & 푸시
- `develop` 브랜치에 push → Development 이미지 빌드 & 푸시
- PR 생성 → 테스트 & 보안 스캔

#### 변경 감지 로직

워크플로우는 `dorny/paths-filter`를 사용해 변경된 서비스만 감지합니다:

```yaml
# 예: product-service만 변경된 경우
# → product-service만 빌드 & 푸시
# → 나머지 18개 서비스는 스킬
```

#### 빌드 프로세스

```bash
# 1. 변경 감지
# 2. Docker 이미지 빌드
# 3. Trivy 보안 스캔
# 4. ECR에 푸시 (3개 태그)
#    - :latest
#    - :main (or :develop)
#    - :git-sha-short
# 5. Helm values 업데이트 (image tag)
# 6. Helm 변경사항 커밋 & 푸시
```

### 2.2 CD 파이프라인 (ArgoCD)

#### ArgoCD 동작 방식

1. GitHub 레포지토리 모니터링 (3분마다 폴링)
2. Helm values 변경 감지
3. 자동으로 EKS에 배포 (`syncPolicy.automated`)
4. Health check & 상태 모니터링

#### ArgoCD Application 배포

```bash
# Production 환경 배포
kubectl apply -f argocd/applications/doa-market-production.yaml

# Development 환경 배포
kubectl apply -f argocd/applications/doa-market-development.yaml

# ArgoCD UI에서 확인
# https://localhost:8080
```

---

## 3. 배포 프로세스

### 3.1 일반적인 배포 흐름

```bash
# 1. 코드 수정 & 커밋
git add product-service/
git commit -m "feat: add new product API"
git push origin main

# 2. GitHub Actions 자동 실행
# - product-service 변경 감지
# - Docker 이미지 빌드
# - ECR 푸시 (새 이미지 태그: abc1234)
# - helm/values/product-service.yaml 업데이트
#   image.tag: abc1234

# 3. ArgoCD 자동 동기화 (3분 이내)
# - Helm 변경 감지
# - EKS에 새 버전 배포
# - Rolling update (무중단 배포)

# 4. 배포 완료
# - ArgoCD UI에서 "Synced" & "Healthy" 확인
```

### 3.2 수동 배포 (긴급 상황)

```bash
# ArgoCD CLI로 강제 동기화
argocd app sync doa-market-production

# 특정 서비스만 재시작
kubectl rollout restart deployment/product-service -n doa-market-prod

# 이전 버전으로 롤백
argocd app rollback doa-market-production <HISTORY_ID>
```

---

## 4. 모니터링 & 디버깅

### 4.1 배포 상태 확인

```bash
# ArgoCD 앱 상태
argocd app get doa-market-production

# Pod 상태
kubectl get pods -n doa-market-prod

# 특정 서비스 로그
kubectl logs -f deployment/product-service -n doa-market-prod

# 이벤트 확인
kubectl get events -n doa-market-prod --sort-by='.lastTimestamp'
```

### 4.2 HPA 상태 확인

```bash
# HPA 상태
kubectl get hpa -n doa-market-prod

# 특정 서비스 HPA
kubectl describe hpa product-service -n doa-market-prod
```

### 4.3 일반적인 문제 해결

#### 문제: 이미지 Pull 실패

```bash
# ECR 인증 확인
aws ecr get-login-password --region ap-northeast-2

# ImagePullSecret 확인
kubectl get secrets -n doa-market-prod
```

#### 문제: ArgoCD가 변경을 감지하지 못함

```bash
# 수동 리프레시
argocd app get doa-market-production --refresh

# Git 연결 확인
argocd repo list
```

#### 문제: Pod가 CrashLoopBackOff

```bash
# 로그 확인
kubectl logs <POD_NAME> -n doa-market-prod --previous

# 환경 변수 확인
kubectl exec -it <POD_NAME> -n doa-market-prod -- env

# Secret 확인
kubectl get secret db-credentials-prod -n doa-market-prod -o yaml
```

---

## 5. 환경별 설정

### 5.1 Development 환경

- **브랜치**: `develop`
- **네임스페이스**: `doa-market-dev`
- **리소스**: 최소 (1 replica, 낮은 CPU/Memory)
- **자동 스케일링**: 비활성화
- **DB**: In-cluster PostgreSQL 또는 Dev RDS

### 5.2 Production 환경

- **브랜치**: `main`
- **네임스페이스**: `doa-market-prod`
- **리소스**: 넉넉함 (3+ replicas, 높은 CPU/Memory)
- **자동 스케일링**: 활성화 (HPA)
- **DB**: Production RDS Multi-AZ

---

## 6. 보안 모범 사례

### 6.1 이미지 보안

```yaml
# Trivy 스캔 결과 확인
# GitHub Actions에서 자동으로 스캔
# Security 탭에서 결과 확인
```

### 6.2 Kubernetes 보안

```yaml
# Pod Security Context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
```

### 6.3 Secret 관리

- **절대 금지**: GitHub에 Secret 커밋
- **추천**: AWS Secrets Manager + External Secrets Operator
- **대안**: Sealed Secrets

---

## 7. 성능 최적화

### 7.1 리소스 튜닝

```yaml
# 부하 테스트 후 조정
resources:
  requests:
    cpu: "500m" # 평균 사용량의 1.5배
    memory: "512Mi" # 평균 사용량의 2배
  limits:
    cpu: "1000m" # 피크 사용량의 1.5배
    memory: "1Gi" # OOM 방지를 위해 여유있게
```

### 7.2 HPA 튜닝

```yaml
# 트래픽 패턴에 맞게 조정
autoscaling:
  minReplicas: 3 # 최소 가용성 보장
  maxReplicas: 20 # 비용 제한
  targetCPUUtilizationPercentage: 60 # 여유있게
```

---

## 8. 추가 리소스

- [Helm 공식 문서](https://helm.sh/docs/)
- [ArgoCD 공식 문서](https://argo-cd.readthedocs.io/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)

---

## 문제가 있나요?

팀 슬랙 채널 #platform 또는 platform-team@doa-market.com으로 문의하세요.
