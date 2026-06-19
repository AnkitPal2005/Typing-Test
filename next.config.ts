import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the turbopack multi-lockfile workspace root warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
