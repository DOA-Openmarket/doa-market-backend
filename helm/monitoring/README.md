# DOA Market Monitoring Stack

Prometheus와 Grafana 기반의 모니터링 스택입니다. kube-prometheus-stack을 사용하여 인프라 및 애플리케이션 메트릭을 수집하고 시각화합니다.

## 📋 구성 요소

- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 대시보드 시각화
- **Alertmanager**: 알림 관리
- **Node Exporter**: 노드 시스템 메트릭
- **kube-state-metrics**: Kubernetes 리소스 메트릭

## 🚀 배포 방법

### 1. Helm 의존성 업데이트

```bash
cd helm/monitoring
helm dependency update
```

### 2. ArgoCD를 통한 배포 (권장)

```bash
# ArgoCD application 등록
kubectl apply -f ../../argocd/applications/monitoring-production.yaml

# 동기화 상태 확인
argocd app get monitoring-production
argocd app sync monitoring-production
```

### 3. 수동 Helm 배포 (개발/테스트용)

```bash
# 개발 환경
helm install monitoring . -n monitoring --create-namespace

# 프로덕션 환경
helm install monitoring . -n monitoring --create-namespace \
  -f values.yaml \
  -f values-production.yaml
```

## ⚙️ 설정

### Prometheus

- **데이터 보존 기간**: 15일
- **스토리지**: 50Gi (EBS gp3)
- **스크래핑 간격**: 30초
- **리소스**: CPU 500m-2000m, Memory 2Gi-4Gi

### Grafana

- **스토리지**: 10Gi (EBS gp3)
- **기본 인증**: admin / changeme (프로덕션에서 변경 필요)
- **Ingress**: ALB를 통한 외부 접근

### Alertmanager

- **스토리지**: 10Gi (EBS gp3)
- **알림 채널**: Slack (설정 필요)

## 🔐 Secret 설정

### Grafana Admin 비밀번호

프로덕션 배포 전에 Grafana admin 비밀번호를 설정하세요:

```bash
kubectl create secret generic grafana-admin-credentials \
  -n monitoring \
  --from-literal=admin-user=admin \
  --from-literal=admin-password='YOUR_SECURE_PASSWORD'
```

### Slack Webhook (선택사항)

Alertmanager에서 Slack 알림을 받으려면:

```bash
# values-production.yaml에서 SLACK_WEBHOOK_URL_PLACEHOLDER를 실제 웹훅 URL로 교체
# 또는 Secret으로 관리:
kubectl create secret generic alertmanager-slack-webhook \
  -n monitoring \
  --from-literal=slack-webhook-url='https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

## 📊 접근 방법

### Grafana

**포트 포워딩 (로컬 접근):**
```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```

브라우저에서 http://localhost:3000 접근

**Ingress (프로덕션):**
- URL: http://grafana.doa-market.internal (values-production.yaml에서 설정)
- ALB를 통해 외부 접근 가능

### Prometheus

**포트 포워딩:**
```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

브라우저에서 http://localhost:9090 접근

### Alertmanager

**포트 포워딩:**
```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-alertmanager 9093:9093
```

브라우저에서 http://localhost:9093 접근

## 📈 메트릭 확인

### 애플리케이션 메트릭 엔드포인트 테스트

```bash
# product-service 메트릭 확인
kubectl port-forward -n doa-market-prod svc/product-service 3002:80
curl http://localhost:3002/metrics

# user-service 메트릭 확인
kubectl port-forward -n doa-market-prod svc/user-service 3005:80
curl http://localhost:3005/metrics
```

### Prometheus에서 메트릭 쿼리

Prometheus UI에서 다음 쿼리를 실행해보세요:

```promql
# 서비스별 요청률 (RPS)
sum(rate(http_requests_total{namespace="doa-market-prod"}[5m])) by (service)

# 서비스별 에러율 (%)
sum(rate(http_request_errors_total{namespace="doa-market-prod"}[5m])) by (service)
/ sum(rate(http_requests_total{namespace="doa-market-prod"}[5m])) by (service) * 100

# P95 레이턴시
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{namespace="doa-market-prod"}[5m])) by (service, le)
)

# DB 커넥션 풀
db_connection_pool_active{namespace="doa-market-prod"}
```

## 🚨 알림 룰

다음 상황에서 알림이 발생합니다:

### Critical (Slack #doa-market-alerts-critical)

- 서비스 다운 (2분 이상)
- 에러율 > 5% (5분 지속)
- Pod CrashLooping
- Node NotReady

### Warning (Slack #doa-market-alerts)

- CPU 사용률 > 80% (5분 지속)
- 메모리 사용률 > 80% (5분 지속)
- P95 레이턴시 > 2초
- DB 커넥션 풀 80% 이상

## 🛠 트러블슈팅

### Prometheus가 서비스를 스크래핑하지 못함

1. ServiceMonitor 확인:
```bash
kubectl get servicemonitors -n doa-market-prod
```

2. Prometheus targets 확인:
- Prometheus UI → Status → Targets
- DOWN 상태인 타겟 확인

3. 서비스의 /metrics 엔드포인트 확인:
```bash
kubectl port-forward -n doa-market-prod svc/<service-name> 3002:80
curl http://localhost:3002/metrics
```

### Grafana 대시보드가 비어있음

1. Prometheus 데이터소스 확인:
- Grafana → Configuration → Data Sources
- Prometheus 데이터소스 테스트

2. 메트릭 데이터 확인:
- Prometheus UI에서 메트릭 쿼리 테스트
- 서비스가 메트릭을 제대로 노출하는지 확인

### Alertmanager 알림이 오지 않음

1. Slack 웹훅 URL 확인:
```bash
kubectl get configmap -n monitoring monitoring-kube-prometheus-alertmanager -o yaml
```

2. Alertmanager 로그 확인:
```bash
kubectl logs -n monitoring -l app=alertmanager
```

3. 알림 테스트:
- Pod 하나를 중지시켜 테스트 알림 발생
```bash
kubectl scale deployment/<service-name> --replicas=0 -n doa-market-prod
```

## 📚 추가 리소스

- [Prometheus 문서](https://prometheus.io/docs/)
- [Grafana 문서](https://grafana.com/docs/)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [PromQL 가이드](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## 🔄 업그레이드

```bash
# Helm 차트 업데이트
helm dependency update

# ArgoCD를 통한 자동 업그레이드 (권장)
# ArgoCD가 git의 변경사항을 감지하고 자동으로 동기화

# 수동 업그레이드
helm upgrade monitoring . -n monitoring \
  -f values.yaml \
  -f values-production.yaml
```

## 🗑 삭제

```bash
# ArgoCD application 삭제
kubectl delete -f ../../argocd/applications/monitoring-production.yaml

# 또는 Helm으로 직접 삭제
helm uninstall monitoring -n monitoring

# Namespace 삭제 (선택사항)
kubectl delete namespace monitoring
```

## 📝 다음 단계

1. **나머지 서비스에 메트릭 추가**
   - product-service와 user-service를 참고하여 나머지 16개 서비스에 메트릭 통합
   - 패턴: createMetricsService() import → 미들웨어 추가 → /metrics 엔드포인트 생성

2. **Grafana 대시보드 생성**
   - Grafana UI에서 대시보드 생성
   - JSON으로 export하여 `helm/monitoring/dashboards/` 디렉토리에 저장
   - Git에 커밋하여 버전 관리

3. **Slack 통합 완료**
   - Slack 웹훅 URL 생성
   - values-production.yaml에 설정
   - 테스트 알림 발송

4. **커스텀 메트릭 추가**
   - 비즈니스 메트릭 (주문 수, 결제 성공률 등)
   - 서비스별 특화 메트릭

5. **장기 데이터 보관**
   - S3로 메트릭 아카이빙 설정 (선택사항)
   - Thanos 또는 Cortex 통합 고려
