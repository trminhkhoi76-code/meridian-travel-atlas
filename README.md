# Meridian Travel

> **Trạng thái: Website đang có luồng deploy AWS Amplify thật, nhưng nghiệp vụ booking, báo cáo admin, thư viện ảnh và danh mục vẫn có thành phần DEMO/MOCK.** Đặc biệt, yêu cầu đặt chỗ trả kết quả thành công dù chỉ được lưu tạm trong bộ nhớ máy chủ; mailer không gửi email thật. Không dùng số liệu admin để báo cáo doanh thu hoặc coi API booking là hệ thống lưu đơn đáng tin cậy. Xem [ma trận trạng thái](docs/SYSTEM_STATUS.md) và [điều kiện go-live](docs/RELEASE_READINESS.md).

Storefront du lịch cho khách Việt: duyệt theo quốc gia, thành phố, địa điểm hay loại trải nghiệm;
lưu vào hành trình chia theo ngày; rồi gửi một yêu cầu đặt chỗ cho cả chuyến. Bản đồ chỉ hỗ trợ:
ghim đặt theo toạ độ thật trên đường bờ biển vẽ sẵn.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Các trang

```
/                                         trang chủ — tìm, danh mục, quốc gia, đánh giá cao, ảnh cộng đồng
/viet-nam                                 quốc gia — thành phố, trải nghiệm (lọc theo danh mục), ảnh, hành trình mẫu
/viet-nam/phu-quoc                        thành phố — danh sách địa điểm + bản đồ
/viet-nam/phu-quoc/bai-ong-lang           địa điểm — toạ độ thật, trải nghiệm tại đây và gần đây, ảnh khách
/trai-nghiem/bungalow-bai-ong-lang        trải nghiệm — ngày khởi hành, số khách, thêm vào giỏ / hành trình
/danh-muc/luu-tru                         danh mục — lọc theo quốc gia, khoảng giá, đánh giá
/thu-vien-anh                             thư viện ảnh cộng đồng, đăng ảnh
/hanh-trinh                               hành trình theo ngày, tuyến trên bản đồ, chi phí
/gio-hang                                 giỏ hàng → thông tin liên hệ → gửi yêu cầu
/tim-kiem?q=                              tìm không phân biệt dấu
```

URL cũ của trải nghiệm (`/viet-nam/phu-quoc/bungalow-bai-ong-lang`) tự chuyển (308) sang
`/trai-nghiem/…`. Danh mục: 6 quốc gia · 18 thành phố · 57 địa điểm · 54 trải nghiệm, prerender tĩnh.

## Kiến trúc ngắn gọn

- **`src/lib/seed.ts`** — dữ liệu mẫu; **`catalog.ts`** — kiểu dữ liệu và đường dẫn.
- **`scripts/build-maps.mjs`** (`npm run maps`) — vẽ sẵn bản đồ thành phố/quốc gia/thế giới từ
  Natural Earth (`world-atlas@2.0.2`). Trình duyệt không tải thư viện bản đồ nào.
- **`src/lib/trip.ts`** + `TripProvider` — hành trình và giỏ hàng, lưu ở localStorage.
- Đặt chỗ gửi tới `POST /api/booking-requests` (**mock/in-memory, không lưu bền vững; không gửi email thật**). Admin hiện kết hợp dữ liệu giả lập và yêu cầu nhận từ khi instance khởi động; không phải số liệu giao dịch thực tế.

Chi tiết cho người phát triển: [CLAUDE.md](CLAUDE.md).

## Thiết kế

"Bản đồ ban ngày": nền sáng, chữ navy, teal cho hành động, cam hoàng hôn cho tín hiệu; một font
Be Vietnam Pro. Chuyển động bằng CSS (hiện dần khi cuộn, nhấc thẻ khi rê chuột), tắt khi hệ điều
hành bật "giảm chuyển động". Có bố cục riêng cho điện thoại (thanh tab dưới, bản đồ thành phố dính
trên và danh sách trượt lên).

## Tài khoản

`/dang-ky`, `/dang-nhap`, `/tai-khoan` dùng auth-service (repo `meridian-backend/auth-service`).
Server Next.js gọi tới qua `AUTH_SERVICE_URL`, token nằm trong cookie HttpOnly. Ở dev, mặc định
gọi `http://localhost:8080`, nên hãy chạy auth-service local (xem README của auth-service) hoặc
đặt `AUTH_SERVICE_URL=http://auth-service.meridian-travel.org` trong `.env.local`. `/admin` chỉ mở
cho tài khoản `ROLE_ADMIN`.

## Còn thiếu

Ảnh thật và kho lưu ảnh (thư viện hiện là ảnh mẫu; đăng ảnh bị khoá trên production), thanh toán,
nhiều hành trình / chia sẻ hành trình, quên mật khẩu / xác thực email, và bản đồ mức đường phố.

## Hệ thống, kiểm thử và triển khai

| Luồng | Trạng thái | Ý nghĩa |
| --- | --- | --- |
| Next.js storefront / UI | **LIVE CODE** | Được build/deploy qua AWS Amplify khi merge `main` |
| Đăng nhập và quyền admin | **INTEGRATION** | Phụ thuộc `AUTH_SERVICE_URL` và backend ngoài repo, cần xác minh runtime thực tế |
| Catalog / bản đồ | **SAMPLE DATA / GENERATED ASSETS** | Danh mục mô phỏng; cần xác nhận sản phẩm, giá và lịch trước khi bán |
| Booking/API/admin metrics | **MOCK** | Chỉ RAM trên mỗi server instance, kèm dữ liệu seed; không gửi mail thật |
| Upload ảnh | **MOCK / DISABLED IN NORMAL PRODUCTION** | Không lưu ảnh; API chỉ nhận metadata nếu bật chế độ giả lập |
| `npm run typecheck`, `npm run build` | **STATIC/BUILD VERIFICATION** | Không phải e2e hay proof of production behavior |

Chạy kiểm tra:

```bash
npm ci
npm run typecheck
npm run build
```

Không có bộ unit/integration/e2e test tự động được khai báo trong `package.json` tại thời điểm chuẩn hóa. Không đánh dấu những test chưa có là đã chạy.

- [System status & evidence types](docs/SYSTEM_STATUS.md)
- [Release readiness and blockers](docs/RELEASE_READINESS.md)
- [Deployment configuration](infra/README.md)
