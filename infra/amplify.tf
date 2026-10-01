# WEB_COMPUTE (chứ không phải WEB) là bắt buộc để Amplify chạy Next.js ở chế độ
# SSR — giữ khả năng thêm API routes / server actions trong chính app này, hoặc
# gọi ra một backend tách riêng qua NEXT_PUBLIC_API_BASE_URL bên dưới.
resource "aws_amplify_app" "this" {
  name     = var.app_name
  platform = "WEB_COMPUTE"

  repository   = var.repository_url
  access_token = var.github_access_token

  # Danh sách này là độc quyền: biến thêm tay trong Amplify Console sẽ bị xoá ở lần
  # apply sau — khai báo mọi biến ở đây. Biến không phải NEXT_PUBLIC_* chỉ tới được
  # server SSR nhờ bước ghi .env.production trong amplify.yml.
  environment_variables = merge(
    {
      NEXT_PUBLIC_API_BASE_URL = var.api_base_url
      ADMIN_USER               = var.admin_user
    },
    var.admin_password == null ? {} : { ADMIN_PASSWORD = var.admin_password },
    var.booking_admin_email == "" ? {} : { BOOKING_ADMIN_EMAIL = var.booking_admin_email },
  )
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch_name

  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = var.repository_url != null
}
