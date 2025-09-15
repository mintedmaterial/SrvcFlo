const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_AGENT_ENDPOINT: process.env.NEXT_PUBLIC_AGENT_ENDPOINT || "http://localhost:7777",
    NEXT_PUBLIC_APP_NAME: "ServiceFlow AI Agent UI",
  },
  // Webpack configuration for better builds
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig