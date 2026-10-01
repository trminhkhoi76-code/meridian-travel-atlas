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

## Khu quản trị (/admin)

`/admin` dùng Basic Auth. Thiếu `admin_password` thì production khoá hẳn (503).

```bash
openssl rand -hex 24          # dán vào admin_password trong terraform.tfvars
terraform apply
```

Sau đó **chạy build lại** (Amplify Console → Redeploy, hoặc push một commit). Đổi
biến môi trường không tự build lại, mà server chỉ nhận giá trị mới qua bước build.

Những điều cần biết:

- **Biến không phải `NEXT_PUBLIC_*` không tới được server SSR** nếu chỉ đặt trong
  Amplify, vì Amplify chỉ đưa chúng vào lúc build. `amplify.yml` ghi `ADMIN_USER`,
  `ADMIN_PASSWORD`, `BOOKING_ADMIN_EMAIL` ra `.env.production` trước `next build`.
  Biến server mới cũng phải thêm vào vòng lặp đó.
- **Chỉ dùng `A-Z a-z 0-9 . _ ~ + / = -`.** Next đọc `.env` bằng dotenv: `#` cắt
  chuỗi, `$` bị expand (kể cả trong ngoặc), nên mật khẩu sẽ bị cắt ngắn mà không
  báo. Terraform (validation) và `amplify.yml` đều chặn trường hợp này.
- **Đừng thêm biến tay trong Amplify Console.** `environment_variables` trong
  `amplify.tf` là danh sách độc quyền, nên lần `apply` sau sẽ xoá biến thêm tay.
- Mật khẩu nằm trong Terraform state và hiện rõ trong Amplify Console, nên giữ state
  ở nơi an toàn. Muốn chặt hơn thì chuyển sang Amplify Secrets (SSM Parameter Store).

## Khi backend sẵn sàng

Set `api_base_url` trong `terraform.tfvars` rồi `terraform apply` lại — Amplify
tự inject biến môi trường mới và rebuild. Code trong app đọc qua
`process.env.NEXT_PUBLIC_API_BASE_URL`.
