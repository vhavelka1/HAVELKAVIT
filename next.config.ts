import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/marcelka/:path*", destination: "/zs/:path*", permanent: true },
      { source: "/api/marcelka/:path*", destination: "/api/zs/:path*", permanent: true },
    ];
  },
  experimental: {
    proxyClientMaxBodySize: "80mb",
    serverActions: {
      bodySizeLimit: "80mb",
    },
  },
};

export default nextConfig;
