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
  
  // General optimizations
  compress: true,
  poweredByHeader: false,
  
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
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
    
    // Optimize cache for better build performance
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Reduce chunk size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000,
          },
        },
      },
    };
    
    return config;
  },
};

module.exports = nextConfig;