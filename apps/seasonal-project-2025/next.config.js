/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ux-lab/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

module.exports = nextConfig;
