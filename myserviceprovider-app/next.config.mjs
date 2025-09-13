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
  // Always use static export for Cloudflare Workers deployment
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Custom webpack config to exclude API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude API routes from server-side build
      config.externals = config.externals || [];
      config.externals.push(/^app\/api/);
    }
    return config;
  },
}

export default nextConfig
