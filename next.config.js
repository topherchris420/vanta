/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every page is static. `next build` writes the site to out/, which static
  // hosts (dappling.network, IPFS) serve directly; Vercel serves it as well.
  // `next export` no longer exists in Next.js 15.
  output: "export",
  experimental: { cpus: 2 },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
