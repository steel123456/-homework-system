import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 输出模式 - 确保所有文件被正确包含
  output: 'standalone',
  experimental: {
    // 启用服务器操作
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
