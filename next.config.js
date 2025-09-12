/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Simplified Image Configuration
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
  },

  // Add experimental features to help with build issues
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['handlebars'],
  },

  // Webpack configuration to handle problematic modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    
    // Ignore handlebars warnings
    config.externals = [...(config.externals || []), 'handlebars'];
    
    return config;
  },
};

module.exports = nextConfig;