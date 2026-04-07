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
}

export default nextConfig
