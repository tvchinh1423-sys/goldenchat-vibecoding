/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Next 14 manifest generation in one process on Windows.
  experimental: { webpackBuildWorker: false },
  generateBuildId: async () => "omnichat-build-id",
};
export default nextConfig;
