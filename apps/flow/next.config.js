/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ux-lab/ui", "@xyflow/react"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: ["next/babel"],
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
