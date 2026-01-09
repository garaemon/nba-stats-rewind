import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nba-stats-rewind/nba-api-client"],
};

export default nextConfig;