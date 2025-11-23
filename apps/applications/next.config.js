/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ux-lab/ui"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
    }
    
    // pdfjs-dist를 외부 모듈로 처리
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push("pdfjs-dist");
    }
    
    return config;
  },
};

module.exports = nextConfig;
