import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <section className="acard anotfound">
      <h1>Không tìm thấy</h1>
      <p>
        Yêu cầu này không có trong kho. Kho giả lập nằm trong bộ nhớ — khởi động lại máy chủ là mất các yêu
        cầu gửi từ web.
      </p>
      <Link href="/admin/yeu-cau" className="btn-p btn-sm">
        Về danh sách yêu cầu
      </Link>
    </section>
  );
}
