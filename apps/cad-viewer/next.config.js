/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  devIndicators: false,
  experimental: {
    // Work around intermittent client manifest crashes from Next DevTools segment explorer.
    devtoolSegmentExplorer: false,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Ensure app code and three-dxf-viewer resolve to a single Three.js instance.
    config.resolve.alias.three = path.resolve(__dirname, "node_modules/three");

    return config;
  },
};

module.exports = nextConfig;
