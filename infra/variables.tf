variable "aws_region" {
  description = "Vùng AWS để deploy Amplify app."
  type        = string
  default     = "ap-southeast-1"
}

variable "app_name" {
  description = "Tên Amplify app."
  type        = string
  default     = "meridian-travel-atlas"
}

variable "branch_name" {
  description = "Nhánh git build/deploy, khớp với nhánh chính trên git provider."
  type        = string
  default     = "main"
}

variable "repository_url" {
  description = <<-EOT
    URL repo (vd: https://github.com/<org>/meridian-travel-atlas). Để trống nếu repo
    chưa được push — apply xong tự nối repo qua AWS Amplify Console (OAuth), an toàn
    hơn lưu access token vào Terraform state.
  EOT
  type        = string
  default     = null
}

variable "github_access_token" {
  description = <<-EOT
    GitHub personal access token (scope "repo") để Terraform tự nối repository_url.
    Chỉ set khi thực sự muốn Terraform quản luôn bước connect — token sẽ nằm trong
    state file, nên cân nhắc backend từ xa có mã hoá (S3 + KMS) trước khi dùng.
  EOT
  type        = string
  default     = null
  sensitive   = true
}

variable "api_base_url" {
  description = "Endpoint backend sẽ tích hợp sau này. Để trống tới lúc backend có domain thật."
  type        = string
  default     = ""
}

variable "admin_user" {
  description = "Tên đăng nhập Basic Auth cho /admin."
  type        = string
  default     = "admin"
}

variable "admin_password" {
  description = <<-EOT
    Mật khẩu Basic Auth cho /admin. Để trống thì production khoá /admin (trả 503).
    Sinh bằng `openssl rand -hex 24`. Giá trị sẽ nằm trong Terraform state và hiện
    rõ trong Amplify Console (biến môi trường) — giữ state ở nơi an toàn.
  EOT
  type        = string
  default     = null
  sensitive   = true

  validation {
    # Next đọc .env bằng dotenv: `#` cắt chuỗi, `$` bị expand — mật khẩu sẽ bị cắt ngắn
    # trong im lặng. amplify.yml cũng chặn lại lúc build, ở đây báo sớm hơn.
    condition     = var.admin_password == null || can(regex("^[A-Za-z0-9._~+/=-]{16,}$", var.admin_password))
    error_message = "admin_password cần ít nhất 16 ký tự, chỉ gồm A-Z a-z 0-9 . _ ~ + / = - (không #, $, khoảng trắng, ngoặc)."
  }
}

variable "booking_admin_email" {
  description = "Hộp thư nhận mail báo yêu cầu đặt chỗ; nhiều địa chỉ ngăn bằng dấu phẩy."
  type        = string
  default     = ""
}
