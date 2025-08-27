/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enhanced caching configuration
  experimental: {
    // Enable partial prerendering for better performance (when stable)
    // ppr: false, // Commented out as it's not stable yet
    
    // Enable optimizations that are stable
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    
    // Enable SWC optimizations
    swcPlugins: [],
    
    // Edge Runtime compatibility
    serverComponentsExternalPackages: ['winston'],
    
    // Hot reload improvements
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Cache headers configuration
  async headers() {
    return [
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/api/patients',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/reports/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=1800, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/api/analytics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=600, stale-while-revalidate=1200',
          },
        ],
      },
      // Static assets caching
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Enhanced Image Optimization with Caching
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
    // Image optimization caching
    minimumCacheTTL: 31536000, // 1 year
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable image optimization
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Build-time optimizations
  webpack: (config, { dev, isServer }) => {
    // Edge Runtime compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // Production optimizations
    if (!dev) {
      // Enable webpack caching for faster builds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
      
      // Optimize chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    } else {
      // Development hot reload improvements
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    
    return config;
  },

  // Environment variables for caching
  env: {
    ROUTE_CACHE_ENABLED: process.env.ROUTE_CACHE_ENABLED || 'true',
    ROUTE_CACHE_TTL: process.env.ROUTE_CACHE_TTL || '300',
    IMAGE_CACHE_TTL: process.env.IMAGE_CACHE_TTL || '31536000',
  },

  // Enhanced rewrites with caching considerations
  async rewrites() {
    return [
      // Flask API proxy with caching headers
      {
        source: '/api/flask/:path*',
        destination: 'http://flask:5001/api/:path*',
      },
      // Cache-friendly static file serving
      {
        source: '/cache-static/:path*',
        destination: '/static/:path*',
      },
    ];
  },

  // Redirects with cache considerations
  async redirects() {
    return [
      // Redirect old API routes to new cached versions
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
        permanent: false, // Use 302 to allow caching flexibility
      },
    ];
  },

  // Generate build ID for cache busting
  generateBuildId: async () => {
    // Use git commit hash for consistent build IDs
    if (process.env.RAILWAY_GIT_COMMIT_SHA) {
      return process.env.RAILWAY_GIT_COMMIT_SHA.substring(0, 7);
    }
    // Fallback to timestamp for local development
    return `build-${Date.now()}`;
  },
};

// Development-specific cache configuration
if (process.env.NODE_ENV === 'development') {
  // Enable more detailed logging
  nextConfig.logging = {
    fetches: {
      fullUrl: true,
    },
  };
}

// Production-specific optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable SWC minification optimizations
  nextConfig.swcMinify = true;
  nextConfig.compiler = {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  };
  
  // Bundle analyzer (optional)
  if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
  } else {
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
