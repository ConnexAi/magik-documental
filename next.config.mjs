/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las pruebas compilan en una carpeta aparte (.next-test) para no pisar el
  // build normal; ver tests/README.md
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    serverComponentsExternalPackages: [
      "pdfkit",
      "sharp",
      "exceljs",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals)
          ? config.externals
          : []),
        "pdfkit",
        "sharp",
        "exceljs",
      ];
    }
    return config;
  },
};

export default nextConfig;
