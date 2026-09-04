terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State cục bộ cho lần đầu. Chuyển sang backend "s3" khi có nhiều người cùng apply.
}

provider "aws" {
  region = var.aws_region
}
