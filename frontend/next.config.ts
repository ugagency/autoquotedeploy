import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aponta explicitamente para a raiz do frontend (evita warning de lockfile
  // detectado em diretórios pai do Desktop).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
