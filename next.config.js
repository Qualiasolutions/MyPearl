/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'],
};

module.exports = nextConfig; 