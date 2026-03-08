const pkg = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vibe-edit/core", "@vibe-edit/ui"],
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
  env: {
    NEXT_PUBLIC_VERSION: pkg.version,
  },
};

module.exports = nextConfig;
