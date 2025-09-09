/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable standalone output for DigitalOcean
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Simplified Image Configuration for Railway
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
  },

  // Simplified webpack configuration
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Basic headers for Railway
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Generate build ID for Railway
  generateBuildId: async () => {
    if (process.env.RAILWAY_GIT_COMMIT_SHA) {
      return process.env.RAILWAY_GIT_COMMIT_SHA.substring(0, 7);
    }
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;