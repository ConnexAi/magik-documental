/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "pdfmake", "exceljs"],
  },
};

export default nextConfig;
