/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "exceljs", "pdfkit"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "pdfkit",
        "sharp",
        "exceljs",
      ];
    }
    return config;
  },
};

export default nextConfig;
