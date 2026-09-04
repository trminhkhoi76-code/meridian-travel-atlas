# Meridian Travel — Atlas du lịch

Một storefront du lịch mà trang chủ là quả cầu. Chọn một điểm đến, quả cầu quay và zoom tới đó; đi
sâu thêm thì hiện các thành phố, rồi từng trải nghiệm, rồi trang đặt chỗ — bốn cấp, cùng một mặt phẳng.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Cách dùng

| Hành động | Kết quả |
|---|---|
| Cuộn xuống / xuống | Đi sâu vào điểm đến đang hướng về giữa tầm nhìn |
| Cuộn lên / lên / `Esc` | Trồi lên một cấp |
| Kéo chuột | Xoay quả cầu |
| Bấm ghim, bấm vào đất liền, hoặc bấm trong mục lục | Vào thẳng nơi đó |

Bốn cấp tương ứng bốn đường dẫn — copy được, chia sẻ được, và Google đọc được:

```
/                                            quỹ đạo — 6 quốc gia
/nhat-ban                                    quốc gia — 3 thành phố
/nhat-ban/kyoto                              thành phố — 3 trải nghiệm
/nhat-ban/kyoto/ryokan-arashiyama            trải nghiệm — giá, ngày khởi hành, đặt chỗ
/hanh-trinh                                  giỏ hàng
```

## Kiến trúc ngắn gọn

- **`src/components/AtlasShell.tsx`** — quả cầu (canvas 2D + `d3-geo` phép chiếu orthographic), ghim,
  thanh trên, mục lục, và khung `.panel` để các trang rót nội dung vào. Nằm trong `layout.tsx` nên
  không bị unmount khi chuyển route.
- **`src/lib/route.ts`** — đọc pathname ra `{ level, country, city, experience }`. Máy ảnh suy ra từ
  đây, nên URL chính là trạng thái zoom.
- **`src/lib/catalog.ts`** — toàn bộ danh mục: 6 quốc gia · 18 thành phố · 54 trải nghiệm, kèm toạ
  độ thật, giá VND, mùa đẹp nhất, đường bay và thị thực.
- **`src/app/**/page.tsx`** — mỗi cấp một trang, prerender tĩnh (83 route), có `generateMetadata` và
  JSON-LD `Product` cho trang trải nghiệm.

Hình thể bản đồ: `world-atlas@2.0.2` — bản 110m cho cấp thế giới, bản 50m tải thêm khi zoom sâu.

## Thiết kế

Giấy dó ấm, biển xanh nhạt, đất liền màu cát, nhấn bằng đỏ sơn mài; chữ Newsreader (tên địa danh),
Be Vietnam Pro (giao diện), IBM Plex Mono (số đo). Có cả giao diện sáng và tối.

## Còn thiếu

Ảnh thật (hiện là dải màu theo phân loại), thanh toán, đăng nhập, và zoom tới mức đường phố — muốn
sâu hơn ~1:6M thì phải chuyển sang raster tiles + mercator.
