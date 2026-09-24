/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { cpus: 2 },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
