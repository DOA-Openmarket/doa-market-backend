# Spot Instances 사용 가이드

AWS Spot Instances를 사용해서 EKS 비용을 **최대 70% 절감**하는 완벽 가이드입니다.

## 💰 예상 비용 절감

### Before (On-Demand만 사용)
```
EKS Control Plane:     $73/월
EC2 t3.medium x6:     $150/월
ECR:                   $10/월
RDS db.t3.medium:      $60/월
------------------------------------
합계:                 $293/월
```

### After (Spot 70% + On-Demand 30%)
```
EKS Control Plane:     $73/월
EC2 On-Demand x2:      $50/월  (Critical 서비스용)
EC2 Spot x5:           $35/월  (일반 서비스용, 70% 할인)
ECR:                   $10/월
RDS db.t3.medium:      $60/월
------------------------------------
합계:                 $228/월  (-$65/월, 22% 절감!)
```

**추가 최적화 시 (Spot 90% 비율)**
- 월 비용: **~$180/월** (38% 절감!)

---

## 🎯 Spot Instance 전략

### 1. 서비스별 Spot 적용 전략

#### ✅ Spot 사용 (비용 절감)
- **api-gateway**: Stateless, 재시작 빠름
- **product-service**: 읽기 위주, 중단 허용
- **user-service**: Stateless
- **cart-service**: 세션 Redis 사용
- **review-service**: 비중요
- **search-service**: 캐시 사용
- **notification-service**: 큐 기반, 재처리 가능
- **file-service**: S3 사용, Stateless
- **admin-service**: 트래픽 낮음
- **banner-service**: 정적 데이터
- **coupon-service**: 읽기 위주
- **shipping-service**: 이벤트 기반
- **stats-service**: 배치 작업
- **settlement-service**: 배치 작업

#### ❌ On-Demand 사용 (안정성 우선)
- **auth-service**: 인증 서비스, 중단 불가
- **payment-service**: 결제 처리, 절대 중단 불가
- **order-service**: 주문 생성, 중요도 높음
- **inventory-service**: 재고 동시성 제어
- **seller-service**: 판매자 핵심 기능

### 2. Node Group 구성

```yaml
# On-Demand: 2대 (안정성)
- Critical 서비스 전용 (auth, payment, order)
- 최소 가용성 보장

# Spot: 3-15대 (비용 절감)
- 일반 서비스 (나머지 14개 서비스)
- Auto Scaling으로 탄력적 운영
```

---

## 🚀 설정 방법

### 1. EKS 클러스터 생성 (Spot 포함)

```bash
# eksctl로 클러스터 생성
eksctl create -f infrastructure/eks-cluster-spot.yaml

# 완료 시간: 약 15-20분
```

**주요 설정:**
- On-Demand Node Group: 2-4대
- Spot Node Group (일반): 1-15대
- Spot Node Group (고성능): 0-10대
- 다양한 인스턴스 타입 믹스 (t3.medium, t3a.medium, c5.large 등)

### 2. AWS Node Termination Handler 설치

Spot Instance가 종료되기 **2분 전**에 Pod를 안전하게 이동시킵니다.

```bash
# IAM 역할 ARN 업데이트
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" infrastructure/aws-node-termination-handler.yaml

# 설치
kubectl apply -f infrastructure/aws-node-termination-handler.yaml

# 확인
kubectl get daemonset -n kube-system aws-node-termination-handler
```

**동작 원리:**
1. EC2 메타데이터 API 모니터링
2. Spot 종료 알림 감지 (120초 전)
3. 해당 노드를 Drain (Pod 이동)
4. 다른 노드에서 Pod 재시작
5. 무중단 서비스 유지

### 3. Cluster Autoscaler 설치

트래픽에 따라 노드를 자동 증감합니다.

```bash
# IAM 역할 ARN 업데이트
sed -i "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" infrastructure/cluster-autoscaler.yaml

# 설치
kubectl apply -f infrastructure/cluster-autoscaler.yaml

# 확인
kubectl get deployment -n kube-system cluster-autoscaler
kubectl logs -n kube-system deployment/cluster-autoscaler
```

**동작:**
- CPU/메모리 사용률 모니터링
- Pending Pod 발견 시 노드 추가
- 저사용률 노드 (< 65%) 제거
- Spot과 On-Demand 자동 선택

### 4. Helm 배포 (Spot 설정 포함)

```bash
# Production 배포 (Spot 활성화)
helm upgrade --install doa-market \
  ./helm/doa-market \
  -f ./helm/doa-market/values.yaml \
  -f ./helm/doa-market/values-production.yaml \
  --namespace doa-market-prod \
  --create-namespace

# 확인
kubectl get pods -n doa-market-prod -o wide
kubectl get nodes -L capacity-type
```

---

## 📊 모니터링 & 확인

### Pod가 Spot 노드에 배치되었는지 확인

```bash
# 노드별 Pod 분포 확인
kubectl get pods -n doa-market-prod -o wide

# Spot 노드 확인
kubectl get nodes -L capacity-type

# 특정 Pod의 노드 affinity 확인
kubectl describe pod <POD_NAME> -n doa-market-prod | grep -A 10 "Node-Selectors"
```

### Spot 중단 이벤트 확인

```bash
# Node Termination Handler 로그
kubectl logs -n kube-system daemonset/aws-node-termination-handler -f

# 클러스터 이벤트
kubectl get events -n doa-market-prod --sort-by='.lastTimestamp' | grep -i spot
```

### Cluster Autoscaler 동작 확인

```bash
# Autoscaler 로그
kubectl logs -n kube-system deployment/cluster-autoscaler -f

# 노드 수 변화
watch kubectl get nodes
```

---

## 🛡️ 고가용성 보장

### 1. Pod Disruption Budget (PDB)

최소 Pod 수를 보장합니다:

```yaml
# 동시에 1개 Pod만 중단 가능
podDisruptionBudget:
  enabled: true
  maxUnavailable: 1
```

**효과:**
- Spot 종료 시 한 번에 1개씩만 이동
- 서비스 가용성 유지

### 2. 다중 Replica

```yaml
# Production: 최소 3개 Replica
replicaCount: 3
minReplicas: 3
```

**효과:**
- 1-2개 Pod 중단해도 서비스 유지
- 자동으로 다른 노드에서 재시작

### 3. Node Affinity

```yaml
# 80%는 Spot, 20%는 On-Demand 선호
nodeAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 80
      preference:
        matchExpressions:
          - key: capacity-type
            operator: In
            values: [spot]
    - weight: 20
      preference:
        matchExpressions:
          - key: capacity-type
            operator: In
            values: [on-demand]
```

**효과:**
- 비용 최적화 (Spot 우선)
- Spot 없으면 On-Demand 사용 (가용성)

### 4. 다양한 인스턴스 타입

```yaml
instanceTypes:
  - t3.medium
  - t3a.medium  # AMD (더 저렴)
  - t3.large
  - c5.large
```

**효과:**
- 한 타입의 Spot 부족해도 다른 타입 사용
- 중단 확률 감소 (다양성)

---

## 🔧 트러블슈팅

### Pod가 Pending 상태

```bash
# 이벤트 확인
kubectl describe pod <POD_NAME> -n doa-market-prod

# 원인 1: Spot 노드 부족
# → Cluster Autoscaler가 자동으로 노드 추가 (2-3분 대기)

# 원인 2: Toleration 누락
# → values.yaml에서 spotEnabled: true 확인

# 원인 3: 리소스 부족
# → 더 큰 인스턴스 타입 추가
```

### Spot Instance 빈번한 종료

```bash
# Spot 중단 이력 확인
kubectl get events --all-namespaces | grep -i terminat

# 해결책 1: 다양한 인스턴스 타입 추가
# eks-cluster-spot.yaml의 instanceTypes에 추가

# 해결책 2: On-Demand 비율 증가
# 중요 서비스는 spotEnabled: false

# 해결책 3: 다른 리전/AZ 사용
# 가용성이 높은 AZ 선택
```

### 비용이 예상보다 높음

```bash
# 현재 노드 상태 확인
kubectl get nodes -L capacity-type,node.kubernetes.io/instance-type

# Spot 비율 확인
kubectl get nodes -L capacity-type | grep -c spot
kubectl get nodes -L capacity-type | grep -c on-demand

# 해결책: Spot 비율 증가
# values-production.yaml에서 더 많은 서비스를 spotEnabled: true로 설정
```

---

## 📈 비용 최적화 팁

### 1. Spot Savings Plans 사용

```bash
# AWS Cost Explorer에서 Savings Plans 구매
# → Spot + Savings Plans 조합으로 최대 90% 절감
```

### 2. Reserved Instances (On-Demand용)

```bash
# Critical 서비스용 On-Demand 2대는 Reserved Instance 구매
# → 추가 40% 절감
```

### 3. Karpenter 사용 (고급)

eksctl 대신 Karpenter 사용:
- 더 빠른 스케일링
- 더 나은 Spot 활용
- Bin packing 최적화

### 4. gp3 볼륨 사용

```yaml
volumeType: gp3  # gp2보다 20% 저렴
volumeSize: 20   # 필요한 만큼만
```

### 5. 사용하지 않는 시간 스케일 다운

```bash
# 개발 환경은 업무 시간만 운영
# CronJob으로 야간/주말 스케일 다운
```

---

## 📊 실제 비용 예시 (월간)

### 시나리오 1: 중소형 트래픽
```
On-Demand (2x t3.medium):  $50
Spot (3x t3.medium):        $21  (평균 70% 할인)
---
합계: $71/월
```

### 시나리오 2: 중대형 트래픽
```
On-Demand (2x t3.medium):  $50
Spot (10x t3.medium):       $70  (평균 70% 할인)
---
합계: $120/월
```

### 시나리오 3: 대형 트래픽 (피크 시)
```
On-Demand (4x t3.medium):  $100
Spot (20x t3.medium):       $140  (평균 70% 할인)
---
합계: $240/월
```

**전체 On-Demand 대비: 50-65% 절감!**

---

## 🎓 추가 학습 리소스

- [AWS Spot Instances Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html)
- [EKS Spot Workshop](https://ec2spotworkshops.com/)
- [Node Termination Handler GitHub](https://github.com/aws/aws-node-termination-handler)
- [Cluster Autoscaler FAQ](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] EKS 클러스터 생성 완료
- [ ] Node Termination Handler 설치
- [ ] Cluster Autoscaler 설치
- [ ] Pod Disruption Budget 설정
- [ ] Helm values에 Spot 설정 추가
- [ ] Critical 서비스는 On-Demand로 설정
- [ ] 모니터링 대시보드 구성
- [ ] Spot 중단 알림 설정 (Slack/Email)

---

**다음 단계:** 실제 배포 후 2주간 모니터링하여 Spot/On-Demand 비율 조정!
