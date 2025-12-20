/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Para desarrollo web: "standalone"
  // Para build de Android/Capacitor: "export"
  output: "standalone",
};

module.exports = nextConfig;
