/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Optimize output for standalone deployment
  output: 'standalone',
}

export default nextConfig
