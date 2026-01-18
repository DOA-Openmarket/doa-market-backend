# Prometheus 유용한 쿼리 모음

Prometheus UI (http://localhost:9090)의 Graph 탭에서 아래 쿼리를 실행할 수 있습니다.

## 🖥️ 인프라 메트릭

### 1. 노드별 CPU 사용률 (%)
```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### 2. 노드별 메모리 사용률 (%)
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

### 3. 노드별 디스크 사용률 (%)
```promql
100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"})
```

### 4. 노드별 네트워크 수신 속도 (bytes/sec)
```promql
rate(node_network_receive_bytes_total[5m])
```

### 5. 노드별 네트워크 송신 속도 (bytes/sec)
```promql
rate(node_network_transmit_bytes_total[5m])
```

---

## ☸️ Kubernetes 메트릭

### 6. Namespace별 Pod 개수
```promql
count(kube_pod_info) by (namespace)
```

### 7. 실행 중인 Pod 수 (doa-market-prod)
```promql
count(kube_pod_status_phase{namespace="doa-market-prod", phase="Running"})
```

### 8. Pod별 메모리 사용량 (MB)
```promql
sum(container_memory_working_set_bytes{namespace="doa-market-prod", container!=""}) by (pod) / 1024 / 1024
```

### 9. Pod별 CPU 사용률
```promql
sum(rate(container_cpu_usage_seconds_total{namespace="doa-market-prod", container!=""}[5m])) by (pod)
```

### 10. Pod 재시작 횟수
```promql
kube_pod_container_status_restarts_total{namespace="doa-market-prod"}
```

---

## 📊 클러스터 전체 메트릭

### 11. 전체 노드 수
```promql
count(kube_node_info)
```

### 12. Ready 상태인 노드 수
```promql
count(kube_node_status_condition{condition="Ready", status="true"} == 1)
```

### 13. 클러스터 전체 CPU 사용량
```promql
sum(rate(node_cpu_seconds_total{mode!="idle"}[5m]))
```

### 14. 클러스터 전체 메모리 사용량 (GB)
```promql
sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024 / 1024
```

### 15. 현재 실행 중인 전체 Pod 수
```promql
count(kube_pod_status_phase{phase="Running"})
```

---

## 🔍 서비스 상태 확인

### 16. 모든 타겟의 UP/DOWN 상태
```promql
up
```

### 17. UP 상태인 타겟만 보기
```promql
up == 1
```

### 18. DOWN 상태인 타겟만 보기
```promql
up == 0
```

### 19. Prometheus 자체 메트릭 수집 성공률
```promql
sum(rate(prometheus_target_scrapes_total[5m])) by (job)
```

### 20. Prometheus가 저장한 총 시계열 데이터 개수
```promql
prometheus_tsdb_head_series
```

---

## 🚀 애플리케이션 메트릭 (서비스에 메트릭 통합 후)

### 21. 서비스별 HTTP 요청률 (RPS)
```promql
sum(rate(http_requests_total{namespace="doa-market-prod"}[5m])) by (service)
```

### 22. 서비스별 에러율 (%)
```promql
sum(rate(http_request_errors_total{namespace="doa-market-prod"}[5m])) by (service)
/ sum(rate(http_requests_total{namespace="doa-market-prod"}[5m])) by (service) * 100
```

### 23. 서비스별 P95 레이턴시
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{namespace="doa-market-prod"}[5m])) by (service, le)
)
```

### 24. 느린 엔드포인트 Top 10
```promql
topk(10,
  sum(rate(http_request_duration_seconds_sum{namespace="doa-market-prod"}[5m])) by (service, route)
  / sum(rate(http_request_duration_seconds_count{namespace="doa-market-prod"}[5m])) by (service, route)
)
```

### 25. DB 커넥션 풀 사용량
```promql
db_connection_pool_active{namespace="doa-market-prod"}
```

---

## 💡 사용 팁

### PromQL 기본 문법

- `rate()`: 증가율 계산 (Counter에 사용)
- `sum()`: 합계
- `avg()`: 평균
- `max()`: 최대값
- `min()`: 최소값
- `count()`: 개수
- `by (label)`: 레이블별 그룹화
- `[5m]`: 5분 시간 범위

### 시간 범위 선택

- `[1m]`: 1분
- `[5m]`: 5분
- `[1h]`: 1시간
- `[1d]`: 1일

### 필터링

```promql
# namespace가 doa-market-prod인 메트릭만
{namespace="doa-market-prod"}

# job이 node-exporter인 메트릭만
{job="node-exporter"}

# 여러 조건
{namespace="doa-market-prod", phase="Running"}
```

---

## 📖 Prometheus UI 사용 방법

### 1. Graph 메뉴
1. http://localhost:9090 접속
2. 상단 메뉴 → **Graph** 클릭
3. 쿼리 입력창에 위의 PromQL 쿼리 입력
4. **Execute** 버튼 클릭
5. **Table/Graph** 탭 전환하며 결과 확인

### 2. Status → Targets
- 메트릭 수집 대상 목록 및 상태
- 🟢 UP: 정상, 🔴 DOWN: 실패

### 3. Alerts
- 설정된 알림 룰 확인
- 🔴 Firing: 발생 중
- 🟡 Pending: 대기 중
- 🟢 Inactive: 정상

### 4. Status → Configuration
- Prometheus 설정 파일 확인

### 5. Status → TSDB Status
- 데이터베이스 통계 및 용량

---

## 🎯 실습 순서

1. **타겟 확인**
   - Status → Targets
   - 모든 타겟이 UP 상태인지 확인

2. **간단한 쿼리**
   - Graph 탭에서 `up` 입력 → Execute
   - Table과 Graph 전환하며 확인

3. **Pod 개수 확인**
   - `count(kube_pod_info) by (namespace)`
   - doa-market-prod의 Pod 개수 확인

4. **리소스 사용량**
   - CPU/메모리 쿼리 실행
   - Graph로 시간에 따른 변화 확인

5. **알림 상태**
   - Alerts 탭
   - 발생한 알림 확인

---

## 📚 추가 학습 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [PromQL 쿼리 가이드](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL 함수 레퍼런스](https://prometheus.io/docs/prometheus/latest/querying/functions/)
