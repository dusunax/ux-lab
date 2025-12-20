/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ux-lab/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Server Actions body 크기 제한 증가
    },
  },
};

module.exports = nextConfig;