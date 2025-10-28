# Production Backend Configuration
terraform {
  backend "s3" {
    bucket         = "case-task-manager-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "case-task-manager-terraform-locks-prod"
  }
}