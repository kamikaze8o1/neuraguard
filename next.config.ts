import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep tracing rooted here so the parent DistroSafe lockfile is ignored.
  outputFileTracingRoot: path.join(__dirname),
  // pdfjs worker is loaded from CDN at runtime in extract.ts
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
