variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "api_target_group_arn" {
  description = "ARN of the API target group"
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Docker image for API"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for Frontend"
  type        = string
}

variable "api_cpu" {
  description = "CPU units for API task"
  type        = number
}

variable "api_memory" {
  description = "Memory for API task"
  type        = number
}

variable "frontend_cpu" {
  description = "CPU units for Frontend task"
  type        = number
}

variable "frontend_memory" {
  description = "Memory for Frontend task"
  type        = number
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
}