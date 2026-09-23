output "idn_dns_records" {
  description = <<-EOT
    Bản ghi DNS của host IDN (ca #2). Zone nằm cùng account nên Amplify tự tạo chúng
    trong Route 53 — output này để đối chiếu, chỉ phải tạo tay nếu Amplify không tự tạo.
  EOT

  value = {
    certificate_verification = aws_amplify_domain_association.idn.certificate_verification_dns_record
    subdomain = [
      for sd in aws_amplify_domain_association.idn.sub_domain : sd.dns_record
    ]
  }
}

output "open_urls" {
  description = <<-EOT
    URL phải mở cho từng ca. Chuỗi đăng ký tương ứng in sẵn trên mỗi trang ca và trong
    src/lib/url-match.ts. Ca 1, 3, 4, 5, 6 chạy trên host đã có sẵn từ trước.
  EOT

  value = {
    "_hub"         = "https://${var.zone_name}/url-match"
    "1_www"        = "https://www.${var.zone_name}/url-match/01-www"
    "2_idn"        = "https://${local.idn_host}/url-match/02-idn"
    "3_host_case"  = "https://${var.zone_name}/url-match/03-case"
    "4_trailing"   = "https://${var.zone_name}/url-match/04-dot/v1.2"
    "5_notcontain" = "https://${var.zone_name}/url-match/05-notcontain?campaign=promo"
    "6_notsame"    = "https://${var.zone_name}/url-match/06-notsame/a"
    "7_protocol"   = "http://${local.http_host}/url-match/07-protocol/"
  }
}

output "s3_website_endpoint" {
  description = "Endpoint thô của bucket ca 7, dùng kiểm tra trước khi CNAME kịp lan."
  value       = aws_s3_bucket_website_configuration.http_only.website_endpoint
}
