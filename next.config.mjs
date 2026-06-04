/** @type {import('next').NextConfig} */
const nextConfig = {
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
