import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  // Add these to handle TensorFlow.js
  reactStrictMode: true,
  transpilePackages: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'],
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      moduleIdStrategy: 'deterministic',
    },
  },
};

export default nextConfig;
