import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Chỉ báo Next.js Dev Tools mặc định neo bottom-left, đè lên dải toạ độ/tỉ lệ
  // của IndexRail đúng góc đó — dời sang bottom-right, nơi .panel không chạm cạnh.
  devIndicators: {
    position: 'bottom-right',
  },
  // Ca #4 của /url-match so sánh `…/v1.2` với `…/v1.2/`, nên cả hai phải trả 200 —
  // cú 308 mặc định của Next sẽ xoá sạch vế không dấu gạch chéo trước khi tag kịp bắn.
  // Cờ này tắt chuẩn hoá cho toàn app; src/middleware.ts dựng lại đúng cú 308 đó cho
  // mọi đường dẫn khác, để hợp đồng "một level một URL" của atlas không vỡ.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
