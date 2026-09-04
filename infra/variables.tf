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
