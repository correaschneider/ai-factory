import type { NextConfig } from 'next';

/** Site estático para o GitHub Pages, servido em /ai-factory. `BASE_PATH=` vazio para servir na raiz. */
const basePath = process.env.BASE_PATH ?? '/ai-factory';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
