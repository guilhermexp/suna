import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  
  // Experimental features (compatible with Next.js 15.4.7)
  experimental: {
    // App Router optimizations
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'framer-motion',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
    
    
    // Server Actions optimizations
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000'],
    },
    
    // Type-safe environment variables
    typedRoutes: true,
    
    // Web Vitals attribution
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    
    // CSS optimizations
    cssChunking: true,
    
    // Client router filter
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
    
    // Memory cache
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    
    // External packages optimizations
    externalDir: true,
    
    // MDX support
    mdxRs: true,
  },
  
  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // React remove properties
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$'],
    } : false,
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // React strict mode
  reactStrictMode: true,
  
  // Images optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Rewrites
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://eu.i.posthog.com/flags',
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimizations
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: isServer ? false : 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module: any) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module: any) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(module.identifier())
                .digest('hex');
              return hash.substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module: any, chunks: any) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(chunks.reduce((acc: string, chunk: any) => acc + chunk.name, ''))
                .digest('hex');
              return hash;
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    // Performance hints
    config.performance = {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };
    
    return config;
  },
  
  // Other configurations
  skipTrailingSlashRedirect: true,
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  
  // Environment variables
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  
  // Modular imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },
  
  // Transpile packages
  transpilePackages: [
    '@supabase/ssr',
    '@supabase/supabase-js',
    '@tanstack/react-query',
  ],
});

export default nextConfig;
