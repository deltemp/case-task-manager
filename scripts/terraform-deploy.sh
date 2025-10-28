#!/bin/bash

# Terraform Deployment Script
# This script deploys the infrastructure using Terraform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified. Usage: $0 <dev|prod> [plan|apply|destroy]"
    exit 1
fi

ENVIRONMENT=$1
ACTION=${2:-plan}

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Validate action
if [[ "$ACTION" != "plan" && "$ACTION" != "apply" && "$ACTION" != "destroy" ]]; then
    print_error "Invalid action. Use 'plan', 'apply', or 'destroy'"
    exit 1
fi

# Set directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
ENV_DIR="$TERRAFORM_DIR/environments/$ENVIRONMENT"

print_header "Deploying Case Task Manager - Environment: $ENVIRONMENT, Action: $ACTION"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if environment directory exists
if [ ! -d "$ENV_DIR" ]; then
    print_error "Environment directory not found: $ENV_DIR"
    exit 1
fi

# Change to terraform directory
cd "$TERRAFORM_DIR"

print_status "Working directory: $(pwd)"

# Initialize Terraform with backend configuration
print_status "Initializing Terraform..."
terraform init -backend-config="$ENV_DIR/backend.tf" -reconfigure

# Validate Terraform configuration
print_status "Validating Terraform configuration..."
terraform validate

# Check for required variables
print_status "Checking required variables..."

# Load environment variables if .env file exists
if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
    print_status "Loading environment variables from .env.$ENVIRONMENT"
    set -a
    source "$PROJECT_ROOT/.env.$ENVIRONMENT"
    set +a
fi

# Check for sensitive variables
if [ -z "$TF_VAR_db_password" ]; then
    print_warning "TF_VAR_db_password not set. You will be prompted for database password."
fi

if [ -z "$TF_VAR_jwt_secret" ]; then
    print_warning "TF_VAR_jwt_secret not set. You will be prompted for JWT secret."
fi

# Execute Terraform command based on action
case $ACTION in
    "plan")
        print_status "Running Terraform plan..."
        terraform plan -var-file="$ENV_DIR/terraform.tfvars" -out="$ENV_DIR/terraform.plan"
        print_status "Plan saved to: $ENV_DIR/terraform.plan"
        print_status "Review the plan above. To apply, run: $0 $ENVIRONMENT apply"
        ;;
    
    "apply")
        # Check if plan file exists
        if [ -f "$ENV_DIR/terraform.plan" ]; then
            print_status "Applying Terraform plan from file..."
            terraform apply "$ENV_DIR/terraform.plan"
        else
            print_status "No plan file found. Running plan and apply..."
            terraform apply -var-file="$ENV_DIR/terraform.tfvars" -auto-approve
        fi
        
        print_status "Deployment completed successfully!"
        
        # Show outputs
        print_status "Infrastructure outputs:"
        terraform output
        
        # Clean up plan file
        if [ -f "$ENV_DIR/terraform.plan" ]; then
            rm "$ENV_DIR/terraform.plan"
        fi
        ;;
    
    "destroy")
        print_warning "This will destroy all infrastructure in the $ENVIRONMENT environment!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        
        if [ "$confirm" = "yes" ]; then
            print_status "Destroying infrastructure..."
            terraform destroy -var-file="$ENV_DIR/terraform.tfvars" -auto-approve
            print_status "Infrastructure destroyed successfully!"
        else
            print_status "Destroy cancelled."
        fi
        ;;
esac

print_header "Terraform $ACTION completed for $ENVIRONMENT environment"