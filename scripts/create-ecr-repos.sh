#!/bin/bash

# ECR 레포지토리 일괄 생성 스크립트

set -e

AWS_REGION="${AWS_REGION:-ap-northeast-2}"

services=(
  api-gateway
  auth-service
  product-service
  order-service
  payment-service
  user-service
  cart-service
  review-service
  notification-service
  search-service
  inventory-service
  seller-service
  admin-service
  file-service
  banner-service
  coupon-service
  shipping-service
  stats-service
  settlement-service
)

echo "Creating ECR repositories in region: $AWS_REGION"
echo "================================================"

for service in "${services[@]}"; do
  repo_name="doa-market-${service}"

  echo "Creating repository: $repo_name"

  aws ecr create-repository \
    --repository-name "$repo_name" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --tags Key=Project,Value=doa-market Key=ManagedBy,Value=terraform 2>/dev/null || echo "Repository $repo_name already exists, skipping..."

  # Set lifecycle policy (keep last 10 images)
  aws ecr put-lifecycle-policy \
    --repository-name "$repo_name" \
    --region "$AWS_REGION" \
    --lifecycle-policy-text '{
      "rules": [
        {
          "rulePriority": 1,
          "description": "Keep last 10 images",
          "selection": {
            "tagStatus": "any",
            "countType": "imageCountMoreThan",
            "countNumber": 10
          },
          "action": {
            "type": "expire"
          }
        }
      ]
    }' 2>/dev/null || echo "Failed to set lifecycle policy for $repo_name"
done

echo ""
echo "✅ All ECR repositories created successfully!"
echo ""
echo "Registry URL: $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Update helm/doa-market/values.yaml with your ECR registry URL"
echo "2. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to GitHub Secrets"
echo "3. Add ECR_REGISTRY to GitHub Secrets"
