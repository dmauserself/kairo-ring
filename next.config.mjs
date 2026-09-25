/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // AVIF first (smaller at the same quality), WebP as the fallback
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: { optimizePackageImports: ['lucide-react', 'framer-motion'] },
};

export default nextConfig;
