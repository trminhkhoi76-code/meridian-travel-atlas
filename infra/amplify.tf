# WEB_COMPUTE (chứ không phải WEB) là bắt buộc để Amplify chạy Next.js ở chế độ
# SSR — giữ khả năng thêm API routes / server actions trong chính app này, hoặc
# gọi ra một backend tách riêng qua NEXT_PUBLIC_API_BASE_URL bên dưới.
resource "aws_amplify_app" "this" {
  name     = var.app_name
  platform = "WEB_COMPUTE"

  repository   = var.repository_url
  access_token = var.github_access_token

  environment_variables = {
    NEXT_PUBLIC_API_BASE_URL = var.api_base_url
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch_name

  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = var.repository_url != null
}
