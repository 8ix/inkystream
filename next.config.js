/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint is a separate concern from building — don't block the build on lint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization for processed e-ink images
  images: {
    unoptimized: true, // Images are pre-processed, no need for additional optimization
  },

  // Output configuration
  output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for better development experience
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Server actions for form handling
    serverActions: {
      bodySizeLimit: '20mb', // Allow larger uploads
    },
  },
};

module.exports = nextConfig;

