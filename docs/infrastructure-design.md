# DOA Market 인프라 설계서

## 문서 정보
- **프로젝트명**: DOA Market (오픈마켓 플랫폼)
- **작성일**: 2026-01-18
- **AWS 계정**: openmarket
- **환경**: Production
- **리전**: ap-northeast-2 (Seoul)

## 목차
1. [개요](#개요)
2. [인프라 아키텍처](#인프라-아키텍처)
3. [AWS 인프라 구성](#aws-인프라-구성)
4. [Kubernetes 클러스터 구성](#kubernetes-클러스터-구성)
5. [마이크로서비스 아키텍처](#마이크로서비스-아키텍처)
6. [네트워크 및 보안](#네트워크-및-보안)
7. [데이터베이스 및 캐시](#데이터베이스-및-캐시)
8. [CI/CD 및 배포](#cicd-및-배포)
9. [확장성 및 고가용성](#확장성-및-고가용성)
10. [비용 최적화](#비용-최적화)

---

## 개요

DOA Market은 AWS 기반의 클라우드 네이티브 마이크로서비스 아키텍처를 채택한 오픈마켓 플랫폼입니다. Amazon EKS(Elastic Kubernetes Service)를 중심으로 19개의 마이크로서비스가 컨테이너화되어 운영되며, ArgoCD를 통한 GitOps 방식의 자동화된 배포 파이프라인을 구축하였습니다.

### 주요 특징
- **컨테이너 오케스트레이션**: Amazon EKS 1.34
- **마이크로서비스 아키텍처**: 19개의 독립적인 서비스
- **데이터베이스**: Amazon Aurora PostgreSQL 17.4 Serverless
- **캐시**: Amazon ElastiCache for Redis
- **배포 자동화**: ArgoCD (GitOps)
- **컨테이너 레지스트리**: Amazon ECR

---

## 인프라 아키텍처

### 전체 아키텍처 개요

```
                                    Internet
                                       |
                                       v
                          [Application Load Balancer]
                         (internet-facing, HTTPS/HTTP)
                                       |
                                       v
                    ┌──────────────────────────────────┐
                    │         Amazon EKS Cluster        │
                    │       (doa-market-prod)          │
                    │                                   │
                    │  ┌─────────────────────────┐     │
                    │  │   API Gateway (3000)    │     │
                    │  └──────────┬──────────────┘     │
                    │             │                     │
                    │   ┌─────────┴─────────┐          │
                    │   │  Microservices    │          │
                    │   │  (19 services)    │          │
                    │   └─────────┬─────────┘          │
                    │             │                     │
                    └─────────────┼─────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    v                           v
            [Aurora PostgreSQL]         [ElastiCache Redis]
               (Serverless)                (cache.t3.micro)
```

### 네트워크 구성도

```
VPC: 192.168.0.0/16 (vpc-05833dfa80ced8e6e)
├── Public Subnets (Internet Gateway 연결)
│   ├── ap-northeast-2a: 192.168.32.0/19
│   ├── ap-northeast-2b: 192.168.64.0/19
│   └── ap-northeast-2c: 192.168.0.0/19
│
└── Private Subnets (NAT Gateway 연결)
    ├── ap-northeast-2a: 192.168.128.0/19
    ├── ap-northeast-2b: 192.168.160.0/19
    └── ap-northeast-2c: 192.168.96.0/19
```

---

## AWS 인프라 구성

### 1. Amazon VPC

#### VPC 구성
| 항목 | 값 |
|------|-----|
| VPC ID | vpc-05833dfa80ced8e6e |
| CIDR Block | 192.168.0.0/16 |
| VPC 이름 | eksctl-doa-market-prod-cluster/VPC |
| DNS 호스트네임 | 활성화 |
| DNS 확인 | 활성화 |

#### 서브넷 구성

**Public Subnets (3개 AZ)**
| 서브넷 ID | CIDR | AZ | 용도 |
|-----------|------|-----|------|
| subnet-0ccb1d9444a8bbee6 | 192.168.32.0/19 | ap-northeast-2a | EKS Public Node, ALB |
| subnet-0959ad4695f172b0f | 192.168.64.0/19 | ap-northeast-2b | EKS Public Node, ALB |
| subnet-025841878378a1846 | 192.168.0.0/19 | ap-northeast-2c | EKS Public Node, ALB |

**Private Subnets (3개 AZ)**
| 서브넷 ID | CIDR | AZ | 용도 |
|-----------|------|-----|------|
| subnet-06a7ad46d87d1ba52 | 192.168.128.0/19 | ap-northeast-2a | EKS Worker Node, RDS, ElastiCache |
| subnet-0477c6587b4a2921a | 192.168.160.0/19 | ap-northeast-2b | EKS Worker Node, RDS, ElastiCache |
| subnet-0e24498064ce117cf | 192.168.96.0/19 | ap-northeast-2c | EKS Worker Node, RDS, ElastiCache |

### 2. Amazon EKS

#### 클러스터 정보
| 항목 | 값 |
|------|-----|
| 클러스터 이름 | doa-market-prod |
| Kubernetes 버전 | 1.34 |
| Endpoint Public Access | Enabled |
| Endpoint Private Access | Disabled |
| Security Group | sg-08b79654b7d8e2a9c |
| 플랫폼 버전 | eks-ecaa3a6 |

#### Node Groups

**1. standard-workers (일반 워크로드)**
| 항목 | 값 |
|------|-----|
| 인스턴스 타입 | t3.medium |
| AMI 타입 | AL2023_x86_64_STANDARD |
| 최소 노드 수 | 2 |
| 최대 노드 수 | 10 |
| 희망 노드 수 | 6 |
| 현재 노드 수 | 6 |
| IAM Role | eksctl-doa-market-prod-nodegroup-s-NodeInstanceRole-rAOO1OKF1sV3 |

**2. large-workers (고성능 워크로드)**
| 항목 | 값 |
|------|-----|
| 인스턴스 타입 | t3.large |
| AMI 타입 | AL2023_x86_64_STANDARD |
| 최소 노드 수 | 2 |
| 최대 노드 수 | 6 |
| 희망 노드 수 | 3 |
| 현재 노드 수 | 3 |
| IAM Role | eksctl-doa-market-prod-nodegroup-l-NodeInstanceRole-dmorDRiJ7eK1 |

**총 노드 현황**: 9개 노드 운영 중 (standard: 6, large: 3)

#### 노드 리소스
- **t3.medium**: 2 vCPU, 4 GiB 메모리
- **t3.large**: 2 vCPU, 8 GiB 메모리

### 3. Application Load Balancer

| 항목 | 값 |
|------|-----|
| 이름 | k8s-doamarke-apigatew-f0b8b750e2 |
| Type | Application Load Balancer |
| Scheme | internet-facing |
| VPC | vpc-05833dfa80ced8e6e |
| DNS 이름 | k8s-doamarke-apigatew-f0b8b750e2-990107643.ap-northeast-2.elb.amazonaws.com |
| 리스너 | HTTP (80), HTTPS (443) |
| 타겟 타입 | IP (Kubernetes Pod IP) |

#### ALB Ingress 설정
```yaml
Annotations:
  - alb.ingress.kubernetes.io/scheme: internet-facing
  - alb.ingress.kubernetes.io/target-type: ip
  - alb.ingress.kubernetes.io/listen-ports: [{"HTTP": 80}, {"HTTPS": 443}]
  - alb.ingress.kubernetes.io/ssl-redirect: 443
  - alb.ingress.kubernetes.io/healthcheck-path: /health
  - alb.ingress.kubernetes.io/healthcheck-interval-seconds: 30
  - alb.ingress.kubernetes.io/healthy-threshold-count: 2
  - alb.ingress.kubernetes.io/unhealthy-threshold-count: 2
```

### 4. IAM 역할

| 역할 이름 | 용도 |
|-----------|------|
| eksctl-doa-market-prod-cluster-ServiceRole-HnT6OXkSoHrc | EKS 클러스터 서비스 역할 |
| eksctl-doa-market-prod-nodegroup-s-NodeInstanceRole-rAOO1OKF1sV3 | Standard Worker 노드 역할 |
| eksctl-doa-market-prod-nodegroup-l-NodeInstanceRole-dmorDRiJ7eK1 | Large Worker 노드 역할 |

---

## Kubernetes 클러스터 구성

### 1. 네임스페이스

| 네임스페이스 | 용도 |
|--------------|------|
| doa-market-prod | Production 애플리케이션 배포 |
| argocd | ArgoCD GitOps 도구 |
| kube-system | Kubernetes 시스템 컴포넌트 |
| default | 기본 네임스페이스 |

### 2. ConfigMaps 및 Secrets

#### Secrets (doa-market-prod 네임스페이스)
| Secret 이름 | 타입 | 용도 |
|-------------|------|------|
| db-credentials-prod | Opaque | RDS PostgreSQL 접속 정보 |
| redis-credentials-prod | Opaque | ElastiCache Redis 접속 정보 |
| rabbitmq-credentials-prod | Opaque | RabbitMQ 접속 정보 |

### 3. 스토리지

- **PersistentVolume**: 현재 사용하지 않음 (Stateless 아키텍처)
- **Storage Class**: gp2 (AWS EBS 기본 스토리지 클래스)

---

## 마이크로서비스 아키텍처

### 서비스 목록 및 구성

총 **19개의 마이크로서비스**가 배포되어 있으며, 각 서비스는 독립적으로 확장 가능합니다.

| # | 서비스 이름 | 포트 | 레플리카 | 용도 |
|---|-------------|------|----------|------|
| 1 | api-gateway | 3000 | 1 | API 게이트웨이 (진입점) |
| 2 | auth-service | 3001 | 1 | 인증/인가 (JWT, OAuth) |
| 3 | user-service | 3005 | 1 | 사용자 관리 |
| 4 | product-service | 3002 | 1 | 상품 관리 |
| 5 | cart-service | 3006 | 2 | 장바구니 |
| 6 | order-service | 3003 | 1 | 주문 관리 |
| 7 | payment-service | 3004 | 1 | 결제 처리 |
| 8 | review-service | 3007 | 1 | 리뷰 관리 |
| 9 | search-service | 3009 | 2 | 상품 검색 |
| 10 | inventory-service | 3010 | 2 | 재고 관리 |
| 11 | seller-service | 3011 | 2 | 판매자 관리 |
| 12 | admin-service | 3012 | 1 | 관리자 기능 |
| 13 | file-service | 3013 | 2 | 파일 업로드/다운로드 |
| 14 | banner-service | 3014 | 1 | 배너 관리 |
| 15 | coupon-service | 3015 | 2 | 쿠폰 관리 |
| 16 | shipping-service | 3016 | 2 | 배송 관리 |
| 17 | stats-service | 3017 | 1 | 통계/분석 |
| 18 | settlement-service | 3018 | 2 | 정산 관리 |
| 19 | notification-service | 3008 | 2 | 알림 서비스 |

### 서비스 간 통신

- **동기 통신**: HTTP/REST API (Service-to-Service)
- **비동기 통신**: RabbitMQ (이벤트 기반 메시징)
- **서비스 디스커버리**: Kubernetes DNS (ClusterIP)

### API Gateway 라우팅

```
External Request → ALB → API Gateway → Individual Services

예시 라우팅:
- /api/v1/auth/*      → auth-service:3001
- /api/v1/users/*     → user-service:3005
- /api/v1/products/*  → product-service:3002
- /api/v1/orders/*    → order-service:3003
- /api/v1/payments/*  → payment-service:3004
```

### 컨테이너 이미지

- **레지스트리**: Amazon ECR
- **리포지토리**: 478266318018.dkr.ecr.ap-northeast-2.amazonaws.com/doa-market-*
- **태그 전략**: Git commit SHA (예: a8e4f11, faf9d21)

---

## 네트워크 및 보안

### 1. 보안 그룹

#### EKS 클러스터 Security Group
- **Security Group ID**: sg-08b79654b7d8e2a9c
- **목적**: EKS Control Plane과 Worker Node 간 통신

#### RDS Security Group
- **Security Group ID**: sg-029b2762076698e0c
- **Inbound**: PostgreSQL (5432) - EKS Worker Node에서만 접근
- **Outbound**: All traffic

#### ElastiCache Security Group
- **Security Group ID**: sg-0d0928b0628e88b68
- **Inbound**: Redis (6379) - EKS Worker Node에서만 접근
- **Outbound**: All traffic

### 2. 네트워크 정책

- **Service Type**: ClusterIP (내부 서비스 통신)
- **External Access**: ALB Ingress를 통한 외부 접근만 허용
- **Private Subnet**: RDS, ElastiCache는 Private Subnet에만 배치
- **Public Subnet**: ALB, NAT Gateway

### 3. TLS/SSL

- **Certificate Manager**: Let's Encrypt (cert-manager)
- **Issuer**: letsencrypt-prod
- **Domain**: api.doa-market.com
- **Ingress TLS**: HTTPS 리디렉션 활성화

### 4. 인증 및 인가

- **Kubernetes RBAC**: 역할 기반 접근 제어
- **Application Auth**: JWT 기반 인증 (auth-service)
- **AWS IAM**: EKS 클러스터 및 AWS 리소스 접근 제어

---

## 데이터베이스 및 캐시

### 1. Amazon Aurora PostgreSQL

#### 클러스터 정보
| 항목 | 값 |
|------|-----|
| 엔진 | aurora-postgresql |
| 엔진 버전 | 17.4 |
| 인스턴스 클래스 | db.serverless |
| 스토리지 | Serverless (자동 확장) |
| Multi-AZ | No (단일 인스턴스) |
| Availability Zone | ap-northeast-2c |
| Endpoint | doa-market-rds-instance-1.c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com |
| Port | 5432 |
| 암호화 | 활성화 (Storage Encryption) |
| Subnet Group | doa-market-db-subnet-group |

#### 백업 및 복구
- **자동 백업**: 활성화 (기본 7일 보관)
- **스냅샷**: 수동 스냅샷 가능
- **복구 시간**: Point-in-Time Recovery (PITR) 지원

#### 성능 및 확장성
- **Serverless 모드**: 자동으로 컴퓨팅 용량 조정
- **ACU (Aurora Capacity Units)**: 워크로드에 따라 자동 조정
- **스토리지**: 자동 확장 (최대 128 TiB)

### 2. Amazon ElastiCache for Redis

#### 클러스터 정보
| 항목 | 값 |
|------|-----|
| 엔진 | redis |
| Replication Group ID | doa-market-redis |
| Cache Node Type | cache.t3.micro |
| 노드 수 | 1 (Primary only) |
| Automatic Failover | Disabled |
| Availability Zone | ap-northeast-2a |
| Subnet Group | doa-market-redis-subnet-group |

#### 사용 용도
- **세션 캐시**: 사용자 세션 정보 저장
- **API 응답 캐시**: 자주 조회되는 데이터 캐싱
- **Rate Limiting**: API 요청 제한
- **임시 데이터 저장**: 장바구니, 임시 토큰

#### 개선 권장사항
- **Multi-AZ 활성화**: 고가용성을 위해 Automatic Failover 활성화 권장
- **Replica 추가**: 읽기 성능 향상을 위한 Read Replica 추가 고려
- **노드 타입 업그레이드**: 트래픽 증가 시 cache.t3.small 이상으로 업그레이드

---

## CI/CD 및 배포

### 1. ArgoCD (GitOps)

#### 설치 및 구성
- **네임스페이스**: argocd
- **접근 방식**: GitOps (Git Repository를 Single Source of Truth로 사용)
- **배포 전략**: Automated Sync (자동 배포)

#### ArgoCD 컴포넌트
| 컴포넌트 | 상태 | 용도 |
|----------|------|------|
| argocd-application-controller | Running | 애플리케이션 상태 관리 |
| argocd-repo-server | Running | Git Repository 연동 |
| argocd-server | Running | Web UI 및 API 서버 |
| argocd-redis | Running | 캐시 및 세션 저장소 |
| argocd-dex-server | Running | SSO 인증 |
| argocd-notifications-controller | Running | 알림 전송 |

### 2. 컨테이너 이미지 빌드

#### GitHub Actions Workflow
```yaml
트리거: Push to main branch
단계:
  1. Checkout 코드
  2. Docker 이미지 빌드
  3. ECR 로그인
  4. 이미지 태그 (Git SHA)
  5. ECR에 푸시
  6. ArgoCD 자동 배포 (Image 태그 업데이트)
```

#### 이미지 태깅 전략
- **Latest**: 최신 빌드 (개발 환경)
- **Git SHA**: Production 배포 (예: a8e4f11, faf9d21)
- **Semantic Versioning**: 릴리스 버전 (예: v1.0.0)

### 3. 배포 프로세스

```
Developer → Git Push → GitHub Actions → ECR Push
                                           ↓
                                      ArgoCD Sync
                                           ↓
                                    Kubernetes Update
                                           ↓
                                    Rolling Update
```

#### Rolling Update 전략
- **Strategy**: RollingUpdate
- **Max Unavailable**: 1
- **Max Surge**: 1
- **Health Check**: Liveness/Readiness Probe

---

## 확장성 및 고가용성

### 1. 수평 확장 (Horizontal Scaling)

#### EKS Node Group 오토스케일링
- **Standard Workers**: 2-10 노드 (현재 6)
- **Large Workers**: 2-6 노드 (현재 3)
- **Metrics**: CPU, Memory 사용률 기반

#### Pod 오토스케일링 (HPA - Horizontal Pod Autoscaler)
현재 수동 레플리카 설정:
- **High Traffic Services**: 2 replicas (cart, file, inventory, notification, search, seller, settlement, shipping, coupon)
- **Standard Services**: 1 replica (api-gateway, auth, admin, banner, order, payment, product, review, stats, user)

**권장사항**: HPA 구성하여 트래픽에 따른 자동 확장
```yaml
Target CPU Utilization: 70%
Min Replicas: 2
Max Replicas: 10
```

### 2. 고가용성 (High Availability)

#### 현재 구성
- **EKS Control Plane**: Multi-AZ (AWS 관리)
- **Worker Nodes**: 3개 AZ 분산 배치
- **ALB**: Multi-AZ 자동 분산
- **서브넷**: 각 AZ마다 Public/Private 서브넷 페어

#### 개선 필요 사항
- **RDS**: Multi-AZ 구성 필요 (현재 단일 AZ)
- **ElastiCache**: Automatic Failover 활성화 필요
- **Critical Services**: 최소 2개 레플리카 유지 (api-gateway, auth, order, payment)

### 3. 장애 복구 (Disaster Recovery)

#### RTO/RPO 목표
- **RTO (Recovery Time Objective)**: < 1시간
- **RPO (Recovery Point Objective)**: < 5분

#### 백업 전략
- **RDS 자동 백업**: 매일 (7일 보관)
- **EKS 설정 백업**: Infrastructure as Code (Terraform/eksctl)
- **Application 설정**: GitOps (ArgoCD + Git)

---

## 비용 최적화

### 1. 컴퓨팅 비용

#### EKS 노드 비용 (월간 예상)
- **t3.medium × 6**: ~$150/월
- **t3.large × 3**: ~$110/월
- **EKS 클러스터**: $72/월
- **총 컴퓨팅 비용**: ~$332/월

#### 최적화 방안
- **Spot Instances**: 개발/테스트 환경에 Spot 인스턴스 활용 (최대 70% 비용 절감)
- **Right Sizing**: 리소스 사용률 모니터링 후 인스턴스 타입 조정
- **예약 인스턴스**: Production 환경 1년 예약 시 ~40% 절감

### 2. 데이터베이스 비용

#### RDS Aurora Serverless
- **장점**: 사용한 만큼만 과금 (Idle 시 비용 절감)
- **단점**: 트래픽이 일정하면 Reserved Instance가 더 저렴할 수 있음

### 3. 네트워크 비용

#### Data Transfer 비용 절감
- **CloudFront CDN**: 정적 파일 캐싱으로 대역폭 비용 절감
- **VPC Endpoint**: S3, ECR 접근 시 NAT Gateway 비용 절감
- **Region 내 전송**: 가능한 한 같은 Region 내에서 데이터 전송

### 4. 모니터링 및 비용 알람

- **AWS Cost Explorer**: 일일/월간 비용 추적
- **Budget Alerts**: 예산 초과 시 알림
- **Unused Resources**: 미사용 EBS 볼륨, Elastic IP 정리

---

## 모니터링 및 로깅 (권장사항)

### 1. 모니터링 스택 (구축 권장)

#### Prometheus + Grafana
```yaml
구성 요소:
  - Prometheus: 메트릭 수집 및 저장
  - Grafana: 시각화 대시보드
  - AlertManager: 알림 관리
  - Node Exporter: 노드 메트릭
  - kube-state-metrics: Kubernetes 메트릭
```

#### 주요 모니터링 메트릭
- **노드 리소스**: CPU, Memory, Disk, Network
- **Pod 상태**: Restart Count, Ready Status
- **애플리케이션 메트릭**: Request Rate, Error Rate, Latency
- **데이터베이스**: Connection Pool, Query Performance

### 2. 로깅 스택 (구축 권장)

#### ELK Stack 또는 CloudWatch Logs
```yaml
옵션 1 - ELK Stack:
  - Elasticsearch: 로그 저장 및 검색
  - Logstash/Fluentd: 로그 수집 및 파싱
  - Kibana: 로그 시각화

옵션 2 - CloudWatch:
  - CloudWatch Logs: 중앙 로그 저장소
  - CloudWatch Insights: 로그 쿼리 및 분석
```

### 3. 애플리케이션 성능 모니터링 (APM)

#### 권장 도구
- **AWS X-Ray**: 분산 트레이싱
- **Datadog APM**: 종합 모니터링
- **New Relic**: 애플리케이션 성능 관리

---

## 보안 강화 방안

### 1. 네트워크 보안

- **WAF (Web Application Firewall)**: ALB 앞단에 AWS WAF 구성
- **DDoS Protection**: AWS Shield Standard (기본) → Shield Advanced (선택)
- **Network ACL**: 추가 네트워크 레벨 방화벽

### 2. 시크릿 관리

- **AWS Secrets Manager**: DB 크레덴셜 자동 로테이션
- **External Secrets Operator**: Kubernetes Secret과 AWS Secrets Manager 연동
- **Sealed Secrets**: Git에 안전하게 Secret 저장

### 3. 컨테이너 보안

- **이미지 스캔**: ECR 이미지 취약점 스캔 활성화
- **Pod Security Standards**: PSS (Restricted) 정책 적용
- **Network Policies**: Pod 간 통신 제한

### 4. 감사 로깅

- **CloudTrail**: AWS API 호출 감사
- **EKS Audit Logs**: Kubernetes API 감사 로깅
- **VPC Flow Logs**: 네트워크 트래픽 로깅

---

## 개선 로드맵

### Phase 1: 안정성 개선 (1-2개월)
1. **RDS Multi-AZ 활성화**: 데이터베이스 고가용성 확보
2. **ElastiCache Failover 설정**: 캐시 레이어 고가용성
3. **Critical Services 레플리카 증가**: api-gateway, auth, order, payment
4. **Health Check 강화**: Liveness/Readiness Probe 세밀 조정

### Phase 2: 모니터링 및 관찰성 (2-3개월)
1. **Prometheus + Grafana 설치**: 메트릭 모니터링
2. **로깅 스택 구축**: ELK 또는 CloudWatch Logs
3. **APM 도구 도입**: 분산 트레이싱
4. **알림 체계 구축**: PagerDuty/Slack 연동

### Phase 3: 성능 최적화 (3-4개월)
1. **HPA (Horizontal Pod Autoscaler) 구성**: 자동 확장
2. **CloudFront CDN**: 정적 콘텐츠 캐싱
3. **Database Query 최적화**: 인덱싱, 쿼리 튜닝
4. **Redis Cluster 모드**: 캐시 성능 향상

### Phase 4: 보안 강화 (4-5개월)
1. **AWS WAF 구성**: 웹 방화벽
2. **Secrets Manager 연동**: 자동 크레덴셜 로테이션
3. **컨테이너 이미지 스캔**: 취약점 자동 검사
4. **Network Policy 적용**: Zero Trust 네트워크

### Phase 5: 비용 최적화 (지속적)
1. **Spot Instance 활용**: 개발/스테이징 환경
2. **Reserved Instance 구매**: Production 환경
3. **Right Sizing**: 리소스 사용률 기반 조정
4. **S3 Lifecycle Policy**: 오래된 로그/백업 자동 삭제

---

## 부록

### A. 주요 엔드포인트

| 엔드포인트 | URL |
|-----------|-----|
| API Gateway (External) | http://k8s-doamarke-apigatew-f0b8b750e2-990107643.ap-northeast-2.elb.amazonaws.com |
| Domain (계획) | https://api.doa-market.com |
| RDS Endpoint | doa-market-rds-instance-1.c3e8ci0mgsqi.ap-northeast-2.rds.amazonaws.com:5432 |

### B. 참고 문서

- [Amazon EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### C. 문의 및 지원

- **Infrastructure Team**: infrastructure@doa-market.com
- **DevOps Team**: devops@doa-market.com
- **AWS Support**: AWS Business Support Plan

---

**문서 버전**: 1.0
**최종 수정일**: 2026-01-18
**작성자**: Infrastructure Team
**검토자**: DevOps Team
