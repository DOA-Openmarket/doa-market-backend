#!/bin/bash

# Spot Instances를 사용하는 EKS 클러스터 빠른 설정 스크립트

set -e

echo "🚀 DOA Market EKS Cluster Setup with Spot Instances"
echo "===================================================="
echo ""

# 변수 설정
CLUSTER_NAME="${CLUSTER_NAME:-doa-market-prod}"
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "📋 Configuration:"
echo "  Cluster Name: $CLUSTER_NAME"
echo "  AWS Region: $AWS_REGION"
echo "  AWS Account ID: $AWS_ACCOUNT_ID"
echo ""

# 확인
read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# 1. EKS 클러스터 생성
echo ""
echo "1️⃣  Creating EKS cluster with Spot Instances..."
echo "   This will take about 15-20 minutes..."
echo ""

eksctl create cluster -f infrastructure/eks-cluster-spot.yaml

echo "✅ EKS cluster created successfully!"

# 2. IAM OIDC Provider 확인
echo ""
echo "2️⃣  Configuring IAM OIDC provider..."
echo ""

eksctl utils associate-iam-oidc-provider \
  --cluster $CLUSTER_NAME \
  --region $AWS_REGION \
  --approve

echo "✅ IAM OIDC provider configured!"

# 3. AWS Node Termination Handler 설치
echo ""
echo "3️⃣  Installing AWS Node Termination Handler..."
echo ""

# AWS Account ID 치환
sed "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" \
  infrastructure/aws-node-termination-handler.yaml | \
  kubectl apply -f -

echo "✅ AWS Node Termination Handler installed!"

# 4. Cluster Autoscaler IAM 정책 생성
echo ""
echo "4️⃣  Creating IAM policy for Cluster Autoscaler..."
echo ""

cat > /tmp/cluster-autoscaler-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions"
      ],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeImages",
        "ec2:GetInstanceTypesFromInstanceRequirements",
        "eks:DescribeNodegroup"
      ],
      "Resource": ["*"]
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name AmazonEKSClusterAutoscalerPolicy \
  --policy-document file:///tmp/cluster-autoscaler-policy.json \
  2>/dev/null || echo "Policy already exists, skipping..."

# IAM 역할 생성
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=cluster-autoscaler \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AmazonEKSClusterAutoscalerPolicy \
  --override-existing-serviceaccounts \
  --approve

echo "✅ Cluster Autoscaler IAM policy created!"

# 5. Cluster Autoscaler 설치
echo ""
echo "5️⃣  Installing Cluster Autoscaler..."
echo ""

sed "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" \
  infrastructure/cluster-autoscaler.yaml | \
  kubectl apply -f -

echo "✅ Cluster Autoscaler installed!"

# 6. Kubernetes Namespaces 생성
echo ""
echo "6️⃣  Creating Kubernetes namespaces..."
echo ""

kubectl create namespace doa-market-prod --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace doa-market-dev --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Namespaces created!"

# 7. Secrets 생성 안내
echo ""
echo "7️⃣  Next: Create Kubernetes Secrets"
echo ""
echo "Run these commands to create secrets:"
echo ""
echo "  # Database credentials"
echo "  kubectl create secret generic db-credentials-prod \\"
echo "    --from-literal=username=admin \\"
echo "    --from-literal=password=YOUR_DB_PASSWORD \\"
echo "    -n doa-market-prod"
echo ""
echo "  # Redis credentials"
echo "  kubectl create secret generic redis-credentials-prod \\"
echo "    --from-literal=password=YOUR_REDIS_PASSWORD \\"
echo "    -n doa-market-prod"
echo ""
echo "  # RabbitMQ credentials"
echo "  kubectl create secret generic rabbitmq-credentials-prod \\"
echo "    --from-literal=username=admin \\"
echo "    --from-literal=password=YOUR_RABBITMQ_PASSWORD \\"
echo "    -n doa-market-prod"
echo ""

# 8. 클러스터 상태 확인
echo ""
echo "8️⃣  Checking cluster status..."
echo ""

echo "Nodes:"
kubectl get nodes -L capacity-type,node.kubernetes.io/instance-type

echo ""
echo "Node Termination Handler:"
kubectl get daemonset -n kube-system aws-node-termination-handler

echo ""
echo "Cluster Autoscaler:"
kubectl get deployment -n kube-system cluster-autoscaler

# 완료
echo ""
echo "=========================================="
echo "✅ EKS Cluster Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Create Kubernetes secrets (see commands above)"
echo "2. Update helm/doa-market/values-production.yaml with your ECR registry"
echo "3. Deploy with ArgoCD:"
echo "   kubectl apply -f argocd/applications/doa-market-production.yaml"
echo ""
echo "💰 Cost savings: Up to 70% with Spot Instances!"
echo ""
