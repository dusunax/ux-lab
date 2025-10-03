/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ux-lab/ui"],
  experimental: {
    esmExternals: "loose",
  },
};

module.exports = nextConfig;
