#!/bin/bash

# Deploy Production Environment Script
# This script deploys the Case Task Manager to production environment using Terraform

set -e

echo "🚀 Starting production deployment..."

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if production environment file exists
if [ ! -f ".env.prod" ]; then
    echo "❌ Production environment file (.env.prod) not found."
    echo "Please copy .env.prod.example to .env.prod and configure it."
    exit 1
fi

# Load production environment variables
source .env.prod

# Validate required environment variables
required_vars=("AWS_REGION" "DB_PASSWORD" "JWT_SECRET" "DOMAIN_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set in .env.prod"
        exit 1
    fi
done

# Build and push Docker images to ECR
echo "🔨 Building and pushing Docker images..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Create ECR repositories if they don't exist
aws ecr describe-repositories --repository-names case-task-api --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name case-task-api --region $AWS_REGION

aws ecr describe-repositories --repository-names case-task-frontend --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name case-task-frontend --region $AWS_REGION

# Build and push API image
echo "📦 Building API image..."
docker build -t case-task-api ./case-task-manager-api
docker tag case-task-api:latest $ECR_REGISTRY/case-task-api:latest
docker push $ECR_REGISTRY/case-task-api:latest

# Build and push Frontend image
echo "📦 Building Frontend image..."
docker build -t case-task-frontend ./case-task-manager-front
docker tag case-task-frontend:latest $ECR_REGISTRY/case-task-frontend:latest
docker push $ECR_REGISTRY/case-task-frontend:latest

# Deploy infrastructure with Terraform
echo "🏗️  Deploying infrastructure with Terraform..."
cd terraform

# Initialize Terraform
terraform init

# Select or create production workspace
terraform workspace select prod 2>/dev/null || terraform workspace new prod

# Plan deployment
echo "📋 Planning Terraform deployment..."
terraform plan -var-file="environments/prod/terraform.tfvars" \
    -var="api_image=$ECR_REGISTRY/case-task-api:latest" \
    -var="frontend_image=$ECR_REGISTRY/case-task-frontend:latest"

# Confirm deployment
read -p "🚀 Deploy to production? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Apply Terraform configuration
echo "🚀 Applying Terraform configuration..."
terraform apply -auto-approve \
    -var-file="environments/prod/terraform.tfvars" \
    -var="api_image=$ECR_REGISTRY/case-task-api:latest" \
    -var="frontend_image=$ECR_REGISTRY/case-task-frontend:latest"

# Get outputs
ALB_DNS=$(terraform output -raw alb_dns_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

echo ""
echo "✅ Production deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Load Balancer: http://$ALB_DNS"
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "   Domain: https://$DOMAIN_NAME"
fi
echo ""
echo "📊 Infrastructure Details:"
echo "   RDS Endpoint: $RDS_ENDPOINT"
echo "   Region: $AWS_REGION"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure your domain DNS to point to: $ALB_DNS"
echo "   2. Monitor the ECS services in AWS Console"
echo "   3. Check application logs in CloudWatch"
echo ""
echo "🛑 To destroy infrastructure: terraform destroy"

cd ..

echo "🎉 Production deployment completed successfully!"