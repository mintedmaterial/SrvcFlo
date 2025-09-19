/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  // Force static export for Cloudflare Pages deployment
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  // Ignore API routes during static export
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude API routes from the build
      config.externals = config.externals || [];
      config.externals.push(/^app\/api/);
    }
    return config;
  },
}

export default nextConfig