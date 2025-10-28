# Production Environment Configuration
project_name = "case-task-manager"
environment  = "prod"
aws_region   = "us-east-1"

# Network Configuration
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnets     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnets    = ["10.1.10.0/24", "10.1.20.0/24", "10.1.30.0/24"]

# Database Configuration
db_instance_class = "db.t3.small"
db_name          = "case_task_manager_prod"
db_username      = "postgres"
# db_password will be set via environment variable or prompted

# Application Configuration
# jwt_secret will be set via environment variable or prompted
api_image      = "your-account.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-api:latest"
frontend_image = "your-account.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-frontend:latest"

# ECS Configuration (production sizing)
api_cpu         = 512
api_memory      = 1024
frontend_cpu    = 256
frontend_memory = 512
desired_count   = 2

# Domain and SSL (configure with your domain)
domain_name     = "your-domain.com"
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id"