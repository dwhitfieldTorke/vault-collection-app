import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in jwks-rsa -> jose, which trips an ESM/CJS
  // interop bug when bundled by Turbopack (ERR_REQUIRE_ESM at runtime).
  // Excluding it from bundling lets Node's native module loader handle it.
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
