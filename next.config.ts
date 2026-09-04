import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Chỉ báo Next.js Dev Tools mặc định neo bottom-left, đè lên dải toạ độ/tỉ lệ
  // của IndexRail đúng góc đó — dời sang bottom-right, nơi .panel không chạm cạnh.
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
