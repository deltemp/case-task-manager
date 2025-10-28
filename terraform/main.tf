# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_instance_class    = var.db_instance_class
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  alb_target_group_arn = module.alb.frontend_target_group_arn
  api_target_group_arn = module.alb.api_target_group_arn
  alb_security_group_id = module.alb.security_group_id
  
  # Database connection
  db_host     = module.rds.db_endpoint
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  
  # Application settings
  jwt_secret = var.jwt_secret
  api_image  = var.api_image
  frontend_image = var.frontend_image
  
  # ECS Configuration
  api_cpu        = var.api_cpu
  api_memory     = var.api_memory
  frontend_cpu   = var.frontend_cpu
  frontend_memory = var.frontend_memory
  desired_count  = var.desired_count
}