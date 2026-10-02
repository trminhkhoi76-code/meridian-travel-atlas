import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <section className="acard">
      <h1 className="ptitle sm">Không tìm thấy</h1>
      <p className="pdesc">
        Yêu cầu này không có trong kho. Kho giả lập nằm trong bộ nhớ — khởi động lại máy chủ là mất các yêu
        cầu gửi từ web.
      </p>
      <Link href="/admin/yeu-cau" className="btn">
        Về danh sách yêu cầu
      </Link>
    </section>
  );
}
