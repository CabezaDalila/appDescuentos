/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: "export", // Comentado para permitir API routes
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
