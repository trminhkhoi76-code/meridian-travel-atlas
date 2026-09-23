# =============================================================================
# Hạ tầng cho bộ tái hiện bảy ca so khớp URL (/url-match).
#
# Chỉ hai trong bảy ca cần hạ tầng mới:
#
#   ca 2  host IDN            → một domain association riêng cho xn--wgv71a.<zone>
#   ca 7  host chỉ-HTTP       → một bucket S3 website + một CNAME
#
# Năm ca còn lại (1, 3, 4, 5, 6) chạy trên apex và www đã được gắn vào Amplify từ
# trước, nên module này không tạo gì cho chúng và cũng không được chạm vào domain
# association đang phục vụ thật.
#
# Root module TÁCH RIÊNG khỏi ../: không tạo Amplify app nào, để `terraform destroy`
# trong thư mục này gỡ đúng phần repro sau khi test xong.
#
# Chi phí phát sinh: bucket S3 vài KB và một bản ghi Route 53 — làm tròn $0. Cert ACM
# và custom domain của Amplify không tính phí. Hosted zone đã tồn tại từ trước.
# =============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.100"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_route53_zone" "this" {
  name         = var.zone_name
  private_zone = false
}

locals {
  idn_host  = "${var.idn_prefix}.${var.zone_name}"
  http_host = "${var.http_prefix}.${var.zone_name}"
}

# -----------------------------------------------------------------------------
# Ca #2 — host IDN.
#
# Association riêng cho chính subdomain punycode, chứ không thêm prefix vào
# association của apex: association đó tạo ngoài Terraform và đang phục vụ traffic
# thật, đụng vào là phải import và rủi ro gỡ nhầm lúc destroy.
#
# Zone nằm cùng account nên Amplify tự tạo bản ghi xác thực và bản ghi CNAME trong
# Route 53. wait_for_verification = false để apply không treo chờ cert.
# -----------------------------------------------------------------------------
resource "aws_amplify_domain_association" "idn" {
  app_id                = var.amplify_app_id
  domain_name           = local.idn_host
  wait_for_verification = false

  sub_domain {
    branch_name = var.branch_name
    prefix      = ""
  }
}

# -----------------------------------------------------------------------------
# Ca #7 — host chỉ phục vụ HTTP.
#
# Đã kiểm: http://meridian-travel.org trả 301 sang https, nên Amplify không thể phục
# vụ vế http. S3 website endpoint thì ngược lại — không có HTTPS, đúng thứ cần để
# đăng ký setting bằng https:// rồi mở bằng http://.
#
# Tên bucket phải trùng y hệt hostname thì CNAME mới trỏ đúng.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "http_only" {
  bucket        = local.http_host
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "http_only" {
  bucket = aws_s3_bucket.http_only.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "http_only" {
  bucket = aws_s3_bucket.http_only.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Bucket công khai có chủ đích: chỉ chứa hai file HTML tĩnh gắn noindex, không có dữ
# liệu nào. Chính sách chỉ mở s3:GetObject, không mở list bucket.
resource "aws_s3_bucket_policy" "http_only" {
  bucket = aws_s3_bucket.http_only.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadForRepro"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.http_only.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.http_only]
}

resource "aws_s3_object" "case_07" {
  bucket        = aws_s3_bucket.http_only.id
  key           = "url-match/07-protocol/index.html"
  content_type  = "text/html; charset=utf-8"
  cache_control = "no-store"

  content = templatefile("${path.module}/site/07-protocol.html.tftpl", {
    open_url = "http://${local.http_host}/url-match/07-protocol/"
    setting  = "https://${local.http_host}/url-match/07-protocol/"
  })
}

resource "aws_s3_object" "root" {
  bucket        = aws_s3_bucket.http_only.id
  key           = "index.html"
  content_type  = "text/html; charset=utf-8"
  cache_control = "no-store"

  content = templatefile("${path.module}/site/index.html.tftpl", {
    case_path = "/url-match/07-protocol/"
  })
}

# Giá trị đã biết sẵn nên bản ghi này Terraform quản được, và `destroy` dọn luôn.
resource "aws_route53_record" "http_only" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.http_host
  type    = "CNAME"
  ttl     = 60
  records = [aws_s3_bucket_website_configuration.http_only.website_domain]
}
