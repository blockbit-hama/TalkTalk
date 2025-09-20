import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove emotion compiler since we're using TailwindCSS
  transpilePackages: ['dlv', 'util-deprecate'],
  
  // Vercel 배포를 위한 설정 (standalone 비활성화)
  // output: 'standalone',

  // 정적 생성 비활성화 (localStorage 등 클라이언트 기능 사용을 위해)
  trailingSlash: false,

  // 빌드 시 타입 및 ESLint 에러 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 빌드 최적화 설정
  serverExternalPackages: [],

  // Force dynamic rendering for pages with localStorage
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  env: {
    GAS_COUPON_API_URL: process.env.GAS_COUPON_API_URL || 'http://localhost:9001',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;