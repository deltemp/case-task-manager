# Development Environment Configuration
project_name = "case-task-manager"
environment  = "dev"
aws_region   = "us-east-1"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets    = ["10.0.10.0/24", "10.0.20.0/24"]

# Database Configuration
db_instance_class = "db.t3.micro"
db_name          = "case_task_manager_dev"
db_username      = "postgres"
# db_password will be set via environment variable or prompted

# Application Configuration
# jwt_secret will be set via environment variable or prompted
api_image      = "your-account.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-api:dev"
frontend_image = "your-account.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-frontend:dev"

# ECS Configuration (smaller for dev)
api_cpu         = 256
api_memory      = 512
frontend_cpu    = 256
frontend_memory = 512
desired_count   = 1

# Domain and SSL (empty for dev - will use ALB DNS)
domain_name     = ""
certificate_arn = ""