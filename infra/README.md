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

## Đăng nhập và khu quản trị (/admin)

Khách đăng nhập và `/admin` đều dựa vào auth-service (repo `meridian-backend/auth-service`),
gọi qua `AUTH_SERVICE_URL` (biến `auth_service_url`, mặc định
`http://auth-service.meridian-travel.org`). Chỉ server Next.js gọi tới; trình duyệt không gọi
thẳng nên không cần CORS. `/admin` chỉ mở cho tài khoản có `ROLE_ADMIN`. Thiếu
`AUTH_SERVICE_URL` hoặc auth-service không phản hồi thì production không đăng nhập được và
`/admin` trả 503.

```bash
terraform apply               # sau khi đổi auth_service_url
```

Sau đó **chạy build lại** (Amplify Console → Redeploy, hoặc push một commit). Đổi
biến môi trường không tự build lại, mà server chỉ nhận giá trị mới qua bước build.

**Cấp quyền quản trị:** auth-service chưa có API đổi role. Đăng ký tài khoản như khách,
rồi đổi `role` của user đó thành `ROLE_ADMIN` trong bảng `users` của auth-service.

Những điều cần biết:

- **Biến không phải `NEXT_PUBLIC_*` không tới được server SSR** nếu chỉ đặt trong
  Amplify, vì Amplify chỉ đưa chúng vào lúc build. `amplify.yml` ghi `AUTH_SERVICE_URL`
  và `BOOKING_ADMIN_EMAIL` ra `.env.production` trước `next build`.
  Biến server mới cũng phải thêm vào vòng lặp đó.
- **Chỉ dùng `A-Z a-z 0-9 . _ ~ + / = @ , : -`.** Next đọc `.env` bằng dotenv: `#` cắt
  chuỗi, `$` bị expand (kể cả trong ngoặc), nên giá trị sẽ bị cắt ngắn mà không báo.
  Terraform (validation) và `amplify.yml` đều chặn trường hợp này.
- **Đừng thêm biến tay trong Amplify Console.** `environment_variables` trong
  `amplify.tf` là danh sách độc quyền, nên lần `apply` sau sẽ xoá biến thêm tay.
- **auth-service đang chạy HTTP.** Mật khẩu đi từ server Amplify tới ALB dưới dạng
  plaintext qua internet. Gắn certificate ACM cho ALB rồi đổi `auth_service_url` sang
  `https://`.

## Khi backend sẵn sàng

Set `api_base_url` trong `terraform.tfvars` rồi `terraform apply` lại — Amplify
tự inject biến môi trường mới và rebuild. Code trong app đọc qua
`process.env.NEXT_PUBLIC_API_BASE_URL`.
