import type { NextConfig } from "next";

// Screens are client-rendered against Supabase (or demo data), so Cache
// Components / prerendered shells are left off — they'd flag every clock read.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
