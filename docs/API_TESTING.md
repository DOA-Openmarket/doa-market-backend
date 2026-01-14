# API Testing & Load Testing 가이드

이 문서는 DOA Market API를 테스트하고 부하 테스트를 수행하는 방법을 설명합니다.

## 목차

1. [AWS Load Balancer 설정](#aws-load-balancer-설정)
2. [Postman 컬렉션 사용](#postman-컬렉션-사용)
3. [부하 테스트](#부하-테스트)
4. [트러블슈팅](#트러블슈팅)

---

## AWS Load Balancer 설정

### 개요

DOA Market API는 Kubernetes 클러스터에 배포되어 있으며, 외부에서 접근하기 위해서는 AWS Application Load Balancer (ALB)를 설정해야 합니다.

### 아키텍처

```
Internet
    ↓
AWS ALB (HTTP Port 80)
    ↓
Kubernetes Ingress
    ↓
API Gateway Service (ClusterIP:3000)
    ↓
API Gateway Pods
```

---

## 1단계: AWS Load Balancer Controller 설치

### 1.1. IAM OIDC Provider 연결

EKS 클러스터가 IAM 역할을 사용할 수 있도록 OIDC Provider를 연결합니다.

```bash
eksctl utils associate-iam-oidc-provider \
  --region=ap-northeast-2 \
  --cluster=doa-market-prod \
  --approve
```

**예상 출력:**
```
✔  created IAM Open ID Connect provider for cluster "doa-market-prod"
```

### 1.2. IAM Policy 생성

AWS Load Balancer Controller가 AWS 리소스를 관리할 수 있도록 IAM Policy를 생성합니다.

```bash
# IAM Policy 다운로드
curl -o /tmp/iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Policy 생성
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file:///tmp/iam_policy.json
```

**중요:** Policy ARN을 기록해두세요:
```
arn:aws:iam::478266318018:policy/AWSLoadBalancerControllerIAMPolicy
```

### 1.3. 추가 권한 Policy 생성

최신 버전의 AWS Load Balancer Controller는 추가 권한이 필요합니다.

```bash
# 추가 권한 Policy 생성
cat > /tmp/additional_permissions.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeListenerAttributes",
        "elasticloadbalancing:ModifyListenerAttributes"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Policy 생성
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerAdditionalPolicy \
  --policy-document file:///tmp/additional_permissions.json
```

### 1.4. IAM 서비스 계정 생성

Kubernetes 서비스 계정을 생성하고 IAM 역할과 연결합니다.

```bash
eksctl create iamserviceaccount \
  --cluster=doa-market-prod \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::478266318018:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --region=ap-northeast-2
```

### 1.5. 추가 Policy 연결

```bash
aws iam attach-role-policy \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --policy-arn arn:aws:iam::478266318018:policy/AWSLoadBalancerControllerAdditionalPolicy
```

### 1.6. Helm으로 AWS Load Balancer Controller 설치

```bash
# Helm repository 추가
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# AWS Load Balancer Controller 설치
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=doa-market-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-northeast-2 \
  --set vpcId=vpc-05833dfa80ced8e6e
```

**확인:**
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl wait --for=condition=available --timeout=120s \
  deployment/aws-load-balancer-controller -n kube-system
```

---

## 2단계: Ingress 설정

### 2.1. Helm Values 수정

`helm/doa-market/values-production.yaml` 파일에 ALB Ingress 설정을 추가합니다.

```yaml
# Production resource limits (optimized for initial deployment)
defaults:
  replicaCount: 1

  # Ingress configuration for AWS ALB
  ingress:
    enabled: true
    className: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
      alb.ingress.kubernetes.io/healthcheck-path: /health
      alb.ingress.kubernetes.io/healthcheck-interval-seconds: '30'
      alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
      alb.ingress.kubernetes.io/healthy-threshold-count: '2'
      alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
      cert-manager.io/cluster-issuer: ''  # Disable cert-manager for HTTP-only ALB
      nginx.ingress.kubernetes.io/ssl-redirect: 'false'  # Disable SSL redirect

# Critical services with higher resources
services:
  api-gateway:
    port: 3000  # API Gateway uses port 3000
    replicaCount: 1
    ingress:
      enabled: true
      hosts:
        - paths:
            - path: /
              pathType: Prefix
      tls: []  # Disable TLS for now (HTTP only - accepts any hostname)
```

**주요 설정 설명:**

- `scheme: internet-facing`: 인터넷에서 접근 가능한 ALB 생성
- `target-type: ip`: Pod IP를 직접 타겟으로 사용 (NodePort 불필요)
- `listen-ports`: HTTP 포트 80만 사용 (HTTPS는 추후 설정 가능)
- `healthcheck-path: /health`: API Gateway의 헬스체크 엔드포인트

### 2.2. Ingress 적용

```bash
# 기존 NGINX Ingress 삭제 (있는 경우)
kubectl delete ingress api-gateway -n doa-market-prod

# ALB Ingress 생성
helm template doa-market helm/doa-market \
  -f helm/doa-market/values-production.yaml \
  -n doa-market-prod \
  --show-only templates/ingress.yaml | \
  kubectl apply -n doa-market-prod -f -
```

### 2.3. ALB 생성 확인

```bash
# Ingress 상태 확인
kubectl get ingress api-gateway -n doa-market-prod

# ALB 생성 상태 확인 (2-3분 소요)
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].{Name:LoadBalancerName,DNS:DNSName,State:State.Code}' \
  --output table
```

**예상 출력:**
```
NAME                               CLASS   HOSTS   ADDRESS                                                              PORTS   AGE
api-gateway                        alb     *       k8s-doamarke-apigatew-f0b8b750e2-41419161.ap-northeast-2.elb.am...   80      2m
```

---

## 3단계: 보안 그룹 설정

### 3.1. 보안 그룹 확인

ALB가 생성되면 자동으로 보안 그룹이 생성되지만, EKS 노드와 통신하기 위한 규칙이 필요합니다.

```bash
# ALB 보안 그룹 ID 확인
ALB_SG=$(aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].SecurityGroups[0]' \
  --output text)
echo "ALB Security Group: $ALB_SG"

# 클러스터 보안 그룹 ID 확인
CLUSTER_SG=$(aws eks describe-cluster \
  --name doa-market-prod \
  --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' \
  --output text)
echo "Cluster Security Group: $CLUSTER_SG"
```

### 3.2. 인그레스 규칙 추가

ALB에서 Pod로 트래픽을 허용하는 규칙을 추가합니다.

```bash
# ALB → Pod (포트 3000) 허용
aws ec2 authorize-security-group-ingress \
  --group-id $CLUSTER_SG \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG
```

**확인:**
```bash
aws ec2 describe-security-groups \
  --group-ids $CLUSTER_SG \
  --query 'SecurityGroups[0].IpPermissions' \
  --output table
```

---

## 4단계: ALB 타겟 헬스 확인

### 4.1. 타겟 그룹 상태 확인

```bash
# 타겟 그룹 ARN 가져오기
TG_ARN=$(aws elbv2 describe-target-groups \
  --load-balancer-arn $(aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].LoadBalancerArn' \
    --output text) \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# 타겟 헬스 확인
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --query 'TargetHealthDescriptions[*].{IP:Target.Id,Port:Target.Port,State:TargetHealth.State}' \
  --output table
```

**정상 상태 출력:**
```
-----------------------------------------
|       DescribeTargetHealth           |
+----------------+-------+--------------+
|      IP        | Port  |    State     |
+----------------+-------+--------------+
|  192.168.35.91 |  3000 |  healthy     |
+----------------+-------+--------------+
```

### 4.2. API 테스트

```bash
# ALB DNS 가져오기
ALB_DNS=$(kubectl get ingress api-gateway -n doa-market-prod \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "ALB DNS: $ALB_DNS"

# Health Check 테스트
curl -H "Host: api.doa-market.com" "http://$ALB_DNS/health"

# API v1 Health Check 테스트
curl -H "Host: api.doa-market.com" "http://$ALB_DNS/api/v1/health"
```

**예상 응답:**
```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2026-01-14T15:22:33.223Z"
}
```

---

## Postman 컬렉션 사용

### 설치 및 설정

#### 1. Postman 컬렉션 Import

1. Postman 열기
2. **Import** 버튼 클릭
3. `backend/postman/DOA-Market-API.postman_collection.json` 파일 선택
4. 환경 파일 Import:
   - `DOA-Market-Local.postman_environment.json` (Port Forward용)
   - `DOA-Market-ALB.postman_environment.json` (ALB 직접 접근용)
   - `DOA-Market-Production.postman_environment.json` (프로덕션용)

#### 2. 환경 선택

상단 우측 환경 드롭다운에서 다음 중 하나 선택:
- **DOA Market - Local (Port Forward)**: `http://localhost:3000`
- **DOA Market - AWS ALB (HTTP)**: ALB DNS 직접 사용
- **DOA Market - Production**: 프로덕션 도메인 (추후 HTTPS 설정 시)

#### 3. API 테스트 시작

1. **Health Checks** → **API Gateway Health** 실행하여 연결 확인
2. **Authentication** → **User Login** 실행
   - 자동으로 `accessToken`, `refreshToken` 환경 변수에 저장됨
3. 인증이 필요한 다른 엔드포인트 테스트 가능

### 포트 포워딩 방법 (로컬 테스트)

ALB 없이 직접 Pod에 연결하여 테스트할 수 있습니다.

```bash
# API Gateway 포트 포워딩
kubectl port-forward -n doa-market-prod svc/api-gateway 3000:3000

# 다른 터미널에서 테스트
curl http://localhost:3000/health
```

Postman에서 **DOA Market - Local** 환경 선택 후 테스트

---

## 부하 테스트

### Newman 설치 및 설정

```bash
cd backend/postman
npm install
```

### 사전 정의된 부하 테스트 시나리오

#### 1. 가벼운 부하 테스트 (개발 환경)
```bash
npm run load-test:light
```
- 5명 동시 사용자
- 각 사용자당 5회 반복
- 약 30초 소요

#### 2. 중간 부하 테스트
```bash
npm run load-test:medium
```
- 20명 동시 사용자
- 각 사용자당 10회 반복
- 약 2-3분 소요

#### 3. 무거운 부하 테스트
```bash
npm run load-test:heavy
```
- 50명 동시 사용자
- 각 사용자당 20회 반복
- 약 5-7분 소요

#### 4. 스트레스 테스트
```bash
npm run load-test:stress
```
- 100명 동시 사용자
- 각 사용자당 50회 반복
- 약 10-15분 소요

### 커스텀 부하 테스트

```bash
node load-test.js [options]

# 옵션:
#   --iterations <n>     사용자당 반복 횟수 (기본: 10)
#   --concurrent <n>     동시 사용자 수 (기본: 10)
#   --environment <env>  환경: local 또는 production (기본: local)
#   --delay <ms>         요청 간 지연 시간 (기본: 100ms)
#   --folder <name>      특정 폴더만 실행

# 예시: 30명 사용자, 15회 반복, 200ms 지연
node load-test.js --concurrent 30 --iterations 15 --delay 200

# 예시: 상품 API에 대한 부하 테스트
node load-test.js --folder Products --concurrent 50 --iterations 20

# 예시: 프로덕션 환경에서 주문 API 부하 테스트
node load-test.js --folder Orders --environment production --concurrent 20 --iterations 10
```

### 부하 테스트 결과 해석

테스트 완료 후 다음과 같은 메트릭이 표시됩니다:

```
═══════════════════════════════════════════════
📈 Load Test Results
═══════════════════════════════════════════════
⏱️  Total Duration: 45.23s
📊 Total Requests: 500
✅ Successful: 495 (99.00%)
❌ Failed: 5 (1.00%)

⚡ Performance Metrics:
   Requests/sec: 11.05
   Avg Response Time: 150.25ms
   Min Response Time: 50ms
   Max Response Time: 1200ms
═══════════════════════════════════════════════
```

**성능 기준:**

| 메트릭 | 좋음 | 보통 | 나쁨 |
|--------|------|------|------|
| Requests/sec | 10+ | 5-10 | <5 |
| Avg Response Time | <500ms | 500-1000ms | >1000ms |
| Success Rate | >95% | 90-95% | <90% |

### 특정 API 부하 테스트

```bash
# 상품 API만 테스트
npm run load-test:products

# 주문 API만 테스트
npm run load-test:orders
```

### Port Forward로 로컬 부하 테스트

```bash
# 터미널 1: Port Forward 시작
kubectl port-forward -n doa-market-prod svc/api-gateway 3000:3000

# 터미널 2: 부하 테스트 실행
cd backend/postman
npm run load-test:medium
```

---

## Newman CLI 테스트

### 전체 컬렉션 실행

```bash
# 로컬 환경
npm test

# 프로덕션 환경
npm run test:prod
```

### 특정 폴더만 실행

```bash
# Health Checks만
npm run test:health

# Authentication만
npm run test:auth

# Products만
npm run test:products

# Orders만
npm run test:orders
```

### HTML 리포트 생성

```bash
# 로컬 환경 테스트 리포트
npm run report

# 프로덕션 환경 테스트 리포트
npm run report:prod

# 리포트 확인
open reports/test-report.html
```

---

## 트러블슈팅

### 1. ALB가 생성되지 않음

**증상:**
```bash
kubectl get ingress api-gateway -n doa-market-prod
# ADDRESS 컬럼이 비어있음
```

**확인 사항:**

1. AWS Load Balancer Controller Pod 상태 확인
```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

2. Ingress 이벤트 확인
```bash
kubectl describe ingress api-gateway -n doa-market-prod
```

**일반적인 오류:**

#### 오류 1: IAM 권한 부족
```
Failed deploy model due to operation error: AccessDenied
```

**해결:**
```bash
# IAM Policy 업데이트
aws iam create-policy-version \
  --policy-arn arn:aws:iam::478266318018:policy/AWSLoadBalancerControllerIAMPolicy \
  --policy-document file:///tmp/iam_policy.json \
  --set-as-default

# Controller 재시작
kubectl rollout restart deployment/aws-load-balancer-controller -n kube-system
```

#### 오류 2: TLS 인증서 문제
```
Failed build model due to ingress: no certificate found for host
```

**해결:**
```yaml
# values-production.yaml에서 TLS 비활성화
services:
  api-gateway:
    ingress:
      tls: []  # 비워두거나 제거
```

### 2. ALB 타겟이 Unhealthy

**증상:**
```bash
aws elbv2 describe-target-health --target-group-arn <TG_ARN>
# State: unhealthy
```

**확인 사항:**

1. Pod가 정상 실행 중인지 확인
```bash
kubectl get pods -n doa-market-prod -l app=api-gateway
kubectl logs -n doa-market-prod -l app=api-gateway
```

2. 헬스체크 경로 확인
```bash
# Pod 내에서 직접 테스트
kubectl exec -n doa-market-prod <pod-name> -- curl http://localhost:3000/health
```

3. 보안 그룹 규칙 확인
```bash
# 클러스터 보안 그룹에 ALB → Pod (포트 3000) 규칙이 있는지 확인
aws ec2 describe-security-groups --group-ids <CLUSTER_SG>
```

**해결:**
```bash
# 보안 그룹 규칙 추가
aws ec2 authorize-security-group-ingress \
  --group-id <CLUSTER_SG> \
  --protocol tcp \
  --port 3000 \
  --source-group <ALB_SG>
```

### 3. API 요청이 타임아웃됨

**증상:**
```bash
curl http://<ALB_DNS>/health
# 응답 없음 또는 타임아웃
```

**원인:**
- Ingress Host 설정 문제
- ALB 리스너 규칙 미설정

**해결:**

1. Host 헤더와 함께 요청
```bash
curl -H "Host: api.doa-market.com" http://<ALB_DNS>/health
```

2. Ingress를 와일드카드로 변경
```yaml
# values-production.yaml
services:
  api-gateway:
    ingress:
      hosts:
        - paths:  # host 필드 제거 (모든 host 허용)
            - path: /
              pathType: Prefix
```

3. Ingress 재생성
```bash
kubectl delete ingress api-gateway -n doa-market-prod
helm template doa-market helm/doa-market \
  -f helm/doa-market/values-production.yaml \
  -n doa-market-prod \
  --show-only templates/ingress.yaml | \
  kubectl apply -n doa-market-prod -f -
```

### 4. Postman에서 401 Unauthorized

**증상:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**해결:**

1. 먼저 로그인하여 토큰 획득
```
Authentication → User Login 실행
```

2. 환경 변수 확인
```
Environment → DOA Market - Production
accessToken이 설정되어 있는지 확인
```

3. 토큰이 만료된 경우
```
Authentication → Refresh Token 실행
```

### 5. 부하 테스트 실패율이 높음

**증상:**
```
Failed: 250 (50.00%)
```

**원인:**
- Pod 리소스 부족
- 동시 요청 수가 너무 많음
- Rate Limiting

**해결:**

1. 요청 간 지연 시간 증가
```bash
node load-test.js --delay 500  # 500ms로 증가
```

2. 동시 사용자 수 감소
```bash
node load-test.js --concurrent 10  # 10명으로 감소
```

3. Pod 리소스 확인 및 증가
```bash
kubectl top pods -n doa-market-prod
kubectl describe pod -n doa-market-prod <pod-name>
```

4. HPA 스케일링 확인
```bash
kubectl get hpa -n doa-market-prod
```

### 6. Newman 의존성 오류

**증상:**
```
Error: Cannot find module 'newman'
```

**해결:**
```bash
cd backend/postman
rm -rf node_modules package-lock.json
npm install
```

---

## 모니터링 및 디버깅

### ALB 액세스 로그 활성화

ALB 트래픽을 분석하려면 액세스 로그를 활성화하세요.

```bash
# S3 버킷 생성 (이미 있는 경우 생략)
aws s3 mb s3://doa-market-alb-logs-ap-northeast-2

# ALB 액세스 로그 활성화
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <ALB_ARN> \
  --attributes \
    Key=access_logs.s3.enabled,Value=true \
    Key=access_logs.s3.bucket,Value=doa-market-alb-logs-ap-northeast-2 \
    Key=access_logs.s3.prefix,Value=api-gateway
```

### CloudWatch 메트릭 확인

```bash
# ALB 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/<ALB_NAME> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### 실시간 로그 모니터링

```bash
# API Gateway 로그
kubectl logs -f -n doa-market-prod -l app=api-gateway

# AWS Load Balancer Controller 로그
kubectl logs -f -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# 여러 Pod 로그 동시 확인
kubectl logs -f -n doa-market-prod -l app=api-gateway --all-containers --max-log-requests=10
```

---

## 보안 권장사항

### 1. HTTPS 설정 (프로덕션 필수)

현재는 HTTP만 사용 중이지만, 프로덕션 환경에서는 반드시 HTTPS를 설정해야 합니다.

```yaml
# values-production.yaml
defaults:
  ingress:
    annotations:
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
      alb.ingress.kubernetes.io/ssl-redirect: '443'
      alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:478266318018:certificate/<CERT_ID>
```

### 2. WAF 연결

```bash
# WAF Web ACL 생성 후 ALB에 연결
aws wafv2 associate-web-acl \
  --web-acl-arn <WAF_ACL_ARN> \
  --resource-arn <ALB_ARN>
```

### 3. IP 화이트리스트 (필요한 경우)

```yaml
# values-production.yaml
defaults:
  ingress:
    annotations:
      alb.ingress.kubernetes.io/inbound-cidrs: '10.0.0.0/8,192.168.0.0/16'
```

---

## 성능 최적화

### 1. ALB Connection Draining 설정

```bash
aws elbv2 modify-target-group-attributes \
  --target-group-arn <TG_ARN> \
  --attributes \
    Key=deregistration_delay.timeout_seconds,Value=30
```

### 2. Keep-Alive 설정

```yaml
# values-production.yaml
defaults:
  ingress:
    annotations:
      alb.ingress.kubernetes.io/target-group-attributes: idle_timeout.timeout_seconds=60
```

### 3. Pod Autoscaling 최적화

```yaml
# values-production.yaml
services:
  api-gateway:
    autoscaling:
      minReplicas: 2
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70
      targetMemoryUtilizationPercentage: 80
```

---

## 유용한 명령어 모음

```bash
# ALB DNS 빠르게 가져오기
kubectl get ingress api-gateway -n doa-market-prod -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# 모든 API Gateway Pod 재시작
kubectl rollout restart deployment/api-gateway -n doa-market-prod

# ALB 타겟 헬스 상태 실시간 모니터링
watch -n 5 "aws elbv2 describe-target-health --target-group-arn <TG_ARN>"

# Ingress 이벤트만 계속 확인
kubectl get events -n doa-market-prod --field-selector involvedObject.name=api-gateway --watch

# Newman으로 빠른 테스트
newman run DOA-Market-API.postman_collection.json -e DOA-Market-Local.postman_environment.json --folder "Health Checks"
```

---

## 참고 자료

### 공식 문서
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Postman Documentation](https://learning.postman.com/docs/)
- [Newman Documentation](https://github.com/postmanlabs/newman)

### 관련 파일
- Postman 컬렉션: `backend/postman/DOA-Market-API.postman_collection.json`
- 환경 파일: `backend/postman/*.postman_environment.json`
- 부하 테스트 스크립트: `backend/postman/load-test.js`
- Helm Values: `backend/helm/doa-market/values-production.yaml`
- Ingress Template: `backend/helm/doa-market/templates/ingress.yaml`

### 트러블슈팅 문서
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 전체 시스템 트러블슈팅 가이드

---

## 문의 및 지원

API 테스팅 관련 문제가 발생하면:
1. 이 문서의 [트러블슈팅](#트러블슈팅) 섹션 참고
2. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 문서 참고
3. 개발팀에 문의

---

**문서 업데이트:** 2026-01-15
**작성자:** DOA Market DevOps Team
**버전:** 1.0.0
