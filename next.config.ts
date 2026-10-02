import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // HTML prerender mặc định mang `s-maxage=31536000`: CloudFront của Amplify giữ một năm
  // và chỉ bỏ khi deploy invalidate. Bản nào bị cache lại giữa lúc chuyển deploy (cache key
  // có cả header Accept, nên mỗi trình duyệt một bản) sẽ kẹt ở UI cũ. Cùng `revalidate`
  // trong app/layout.tsx: CDN giữ 5 phút, quá 1 giờ thì không được phục vụ bản cũ nữa.
  expireTime: 3600,
  devIndicators: {
    position: 'bottom-right',
  },
  async redirects() {
    return [
      // "Danh mục" không có trang tổng — vào thẳng danh mục đầu tiên.
      { source: '/danh-muc', destination: '/danh-muc/luu-tru', permanent: false },
    ];
  },
};

export default nextConfig;
