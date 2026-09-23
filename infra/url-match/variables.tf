variable "aws_region" {
  description = <<-EOT
    Region chứa Amplify app đang chạy. App `meridian-travel-atlas` nằm ở ap-northeast-1 —
    sai region thì `aws_amplify_domain_association` báo không tìm thấy app.
  EOT
  type        = string
  default     = "ap-northeast-1"
}

variable "amplify_app_id" {
  description = <<-EOT
    App ID của Amplify app đang chạy. Module này KHÔNG tạo app — nó chỉ gắn thêm một
    host IDN, để `terraform destroy` gỡ đúng phần repro mà không đụng tới app hay tới
    domain association của apex/www đang phục vụ thật. Lấy bằng:
      aws amplify list-apps --region ap-northeast-1 \
        --query "apps[].{name:name,id:appId}" --output table
  EOT
  type        = string
}

variable "branch_name" {
  description = "Nhánh Amplify phục vụ host IDN."
  type        = string
  default     = "main"
}

variable "zone_name" {
  description = <<-EOT
    Zone đã delegate về Route 53. Apex và www của zone này đã được gắn vào Amplify từ
    trước và phục vụ ca 1, 3, 4, 5, 6 — module này không chạm vào chúng.
  EOT
  type        = string
  default     = "meridian-travel.org"
}

variable "idn_prefix" {
  description = <<-EOT
    Prefix punycode cho ca #2: 日本 → "xn--wgv71a". Amplify và ACM chỉ nhận dạng
    punycode, không nhận Unicode.
  EOT
  type        = string
  default     = "xn--wgv71a"
}

variable "http_prefix" {
  description = <<-EOT
    Prefix của host chỉ-HTTP cho ca #7. Host đầy đủ phải trùng y hệt tên bucket S3 thì
    CNAME tới website endpoint mới khớp.
  EOT
  type        = string
  default     = "http-demo"
}
