import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Existing interactive client routes use browser auth state and are not
  // compatible with Next's instant-navigation validation yet.
  cacheComponents: false,
  partialPrefetching: false,
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
