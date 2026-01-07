import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nba-stats-rewind/nba-api-client"],
  async rewrites() {
    return [
      {
        source: '/nba-api/:path*',
        destination: 'https://stats.nba.com/stats/:path*',
      },
      {
        source: '/nba-cdn/:path*',
        destination: 'https://cdn.nba.com/static/json/liveData/:path*',
      },
    ];
  },
};

export default nextConfig;