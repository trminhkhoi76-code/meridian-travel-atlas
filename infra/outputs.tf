output "amplify_app_id" {
  value = aws_amplify_app.this.id
}

output "amplify_default_domain" {
  description = "Domain gốc Amplify cấp cho app (dùng để build branch_url và trỏ custom domain sau này)."
  value       = aws_amplify_app.this.default_domain
}

output "branch_url" {
  description = "URL xem app sau khi build lần đầu thành công."
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}
