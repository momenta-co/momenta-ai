import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3p3fw3rutb1if.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
