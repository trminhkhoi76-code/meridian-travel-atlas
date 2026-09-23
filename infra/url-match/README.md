# Bộ tái hiện bảy ca so khớp URL

Hạ tầng và quy trình chạy cho bảy ca lệch giữa **side đo lường** (heatmap) và **side popup**
khi so khớp URL. Các trang tái hiện nằm trong app chính tại [`/url-match`](../../src/app/url-match);
thư mục này chỉ dựng phần hạ tầng còn thiếu.

## Năm ca không cần hạ tầng mới

`meridian-travel.org` và `www.meridian-travel.org` đã được gắn vào Amplify app từ trước
(cùng trỏ về một CloudFront distribution, cert đã validate, cả hai trả 200). Ca 1, 3, 4, 5, 6
chạy thẳng trên hai host đó — và ca 1 vì thế chạy trên đúng cặp apex/www mà khách hàng thật
gặp, chứ không phải một cặp host dựng riêng.

Module này **không chạm** vào domain association đó. Nó được tạo ngoài Terraform và đang phục
vụ traffic thật; `terraform plan` phải luôn báo `0 to destroy`.

## Module này tạo gì

| Ca | Tài nguyên | Vì sao |
|---|---|---|
| 2 | `aws_amplify_domain_association` cho `xn--wgv71a.meridian-travel.org` | cần một host IDN; Amplify và ACM chỉ nhận dạng punycode |
| 7 | bucket S3 + website config + 2 object + CNAME | `http://meridian-travel.org` bị Amplify 301 sang https, nên vế http phải nằm ngoài Amplify |

Tổng cộng 8 resource. Chi phí: bucket vài KB và một bản ghi Route 53 — làm tròn $0. Cert ACM
và custom domain của Amplify không tính phí. Hosted zone đã tồn tại từ trước nên không phát
sinh thêm $0.50/tháng.

## Chạy

```bash
cd infra/url-match
cp terraform.tfvars.example terraform.tfvars   # điền amplify_app_id
terraform init
terraform plan      # phải là "8 to add, 0 to change, 0 to destroy"
terraform apply
terraform output open_urls
```

Zone nằm cùng account nên Amplify tự tạo bản ghi xác thực và CNAME cho host IDN trong Route 53.
`wait_for_verification = false` nên `apply` trả về ngay thay vì treo chờ cert. Nếu sau vài phút
host IDN vẫn chưa lên, đối chiếu `terraform output idn_dns_records` với bản ghi thật trong zone.

## Đăng ký setting trong console

Mười bốn entry: mỗi ca cần **một** page setting bên heatmap và **một** điều kiện bên popup,
dùng chung chuỗi. Chuỗi chính xác và kiểu so khớp in sẵn trên từng trang ca, cũng như trong
[`src/lib/url-match.ts`](../../src/lib/url-match.ts) — lấy từ đó, đừng gõ lại bằng tay.

Hai điểm dễ làm hỏng phép thử:

- **Ca 5 và 6 phải nhập đủ 2 giá trị.** Với 1 giá trị thì AND và OR cho cùng kết quả và lệch
  không lộ ra.
- **Ca 3 phải gõ hoa/thường lẫn lộn đúng ở phần host** (`https://Meridian-Travel.org/…`), không
  phải ở path — path phân biệt hoa thường là đúng chuẩn, chỉ host mới sai.

## Quan sát

Mỗi URL mở bằng một profile trình duyệt sạch, DevTools → Network, lọc `mieru-ca`. Ghi lại hai
điều: beacon heatmap có bắn không và payload URL là gì; response của Optimize có trả popup
không. Phán quyết nằm ngay ở request/response — nhanh và chính xác hơn chờ dashboard tổng hợp.

Mỗi trang ca in sẵn URL thật mà trình duyệt đang giữ cùng các dạng chuẩn hoá (cắt `www.`,
punycode, hạ chữ thường, dấu gạch chéo cuối), nên ảnh chụp màn hình tự giải thích được.

Ca 5 và 6 có sẵn link đối chứng. Chạy cả đối chứng thì mới kết luận được lệch đến từ AND/OR
chứ không phải từ setting nhập sai.

## Dọn

```bash
terraform destroy
```

Xoá host IDN, bucket và CNAME của ca 7. Apex, www và app vẫn nguyên. Nhớ xoá tay mười bốn entry
trong console — Terraform không quản lý chúng.

## Rủi ro đã biết

- **Ca 4 trên Amplify.** Path `…/04-dot/v1.2` có dấu chấm nên tầng CDN có thể coi là file tĩnh
  và trả 404. Cục bộ với `next start` thì cả hai dạng có/không dấu gạch chéo đều trả 200 (đã
  kiểm). Nếu Amplify trả 404, đổi route sang catch-all và kiểm lại rewrite rules.
- **Ca 2 trên Amplify.** Nếu Amplify từ chối domain association cho `xn--wgv71a.…`, ca này phải
  chuyển sang rig local bằng hosts file.
- **Dữ liệu đo lường bị trộn.** Bảy trang dùng chung tag trong
  [`src/app/layout.tsx`](../../src/app/layout.tsx), nên chúng được đo dưới cùng site ID với các
  trang sản phẩm, và mười bốn entry setting nằm chung danh sách với setting production. Đã thống
  nhất chấp nhận; dọn setting sau khi test xong.
- **Ca 7 không phải bug.** Hai side đồng ý với nhau nên URL không tạo ra triệu chứng gì. Bằng
  chứng ở đây là code reference chỗ giao thức bị bỏ qua ở cả hai bên, không phải ảnh chụp màn
  hình.
