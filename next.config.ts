import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // To serve this app under a sub-path later (e.g. example.com/asha-awaaz),
  // uncomment the next line. Left off so it runs at the domain root.
  // basePath: "/asha-awaaz",
};

export default nextConfig;
