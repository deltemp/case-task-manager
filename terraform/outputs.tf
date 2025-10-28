# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

# Database Outputs
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "db_port" {
  description = "RDS instance port"
  value       = module.rds.db_port
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.alb.zone_id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = module.ecs.api_service_name
}

output "frontend_service_name" {
  description = "Name of the Frontend ECS service"
  value       = module.ecs.frontend_service_name
}

# Application URLs
output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.alb.dns_name}"
}

output "api_url" {
  description = "API URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}/api" : "http://${module.alb.dns_name}/api"
}