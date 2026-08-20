/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'xlsx']
  }
};

module.exports = nextConfig;
