# Infra — AWS Amplify Hosting

Terraform tạo một Amplify app chạy Next.js ở chế độ SSR (`platform = "WEB_COMPUTE"`),
giữ khả năng thêm API routes trong app hoặc gọi ra một backend tách riêng sau này
qua biến môi trường `NEXT_PUBLIC_API_BASE_URL`.

## Chạy lần đầu

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # rồi chỉnh giá trị thật
terraform init
terraform plan
terraform apply
```

Cần AWS credentials đã cấu hình sẵn (`aws configure`, biến môi trường, hoặc SSO
profile) với quyền tạo Amplify app.

## Nối git repo

- **Repo đã có PAT sẵn sàng:** điền `repository_url` và `github_access_token` trong
  `terraform.tfvars` — Terraform tự nối và bật auto-build mỗi lần push.
- **Chưa muốn lưu token vào state (khuyên dùng):** để hai biến đó trống, `apply`
  vẫn tạo app ở chế độ "manual deploy". Sau đó vào AWS Amplify Console → app vừa
  tạo → **Connect a repository**, đăng nhập GitHub qua OAuth (an toàn hơn PAT).
  Lưu ý: nối qua Console sẽ tạo drift nhẹ với state (Terraform không biết về
  repository đã nối) — `terraform plan` sau đó có thể đề nghị xoá cấu hình repo;
  bỏ qua thay đổi đó hoặc import lại giá trị vào state nếu cần khớp tuyệt đối.

## Khi backend sẵn sàng

Set `api_base_url` trong `terraform.tfvars` rồi `terraform apply` lại — Amplify
tự inject biến môi trường mới và rebuild. Code trong app đọc qua
`process.env.NEXT_PUBLIC_API_BASE_URL`.
