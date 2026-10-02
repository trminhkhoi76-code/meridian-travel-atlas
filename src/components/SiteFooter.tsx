import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container sf-in">
        <div className="sf-brand">
          <b>Meridian Travel</b>
          <span>Trải nghiệm du lịch chọn lọc cho khách Việt. Chưa thu tiền khi gửi yêu cầu — nhân viên xác nhận chỗ trước.</span>
        </div>
        <div>
          <b>Khám phá</b>
          <Link href="/">Điểm đến</Link>
          <Link href="/danh-muc/luu-tru">Danh mục</Link>
          <Link href="/thu-vien-anh">Thư viện ảnh</Link>
        </div>
        <div>
          <b>Chuyến đi của bạn</b>
          <Link href="/hanh-trinh">Hành trình</Link>
          <Link href="/gio-hang">Giỏ hàng</Link>
          <Link href="/tai-khoan">Tài khoản</Link>
        </div>
        <div>
          <b>Tìm nhanh</b>
          <Link href="/tim-kiem">Tìm điểm đến</Link>
          <Link href="/dang-ky">Tạo tài khoản</Link>
        </div>
      </div>
    </footer>
  );
}
