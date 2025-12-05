/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization for processed e-ink images
  images: {
    unoptimized: true, // Images are pre-processed, no need for additional optimization
  },

  // Output configuration
  output: 'standalone',

  // Exclude admin routes from production build on Vercel
  // This is handled by vercel.json rewrites in production
  // The admin routes will still build but be unreachable

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

