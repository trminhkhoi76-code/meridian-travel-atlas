import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
