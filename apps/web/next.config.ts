import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nba-stats-rewind/nba-api-client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
        pathname: "/logos/nba/**",
      },
    ],
  },
};

export default nextConfig;