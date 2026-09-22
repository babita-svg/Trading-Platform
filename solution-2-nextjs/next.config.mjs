import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack picks the workspace root by locating the nearest package-lock.json.
  // Because this project lives inside a directory that has its own lock file at
  // the repo root (from the Express backend), we pin the workspace root explicitly
  // so Turbopack resolves Next.js from this package, not the parent.
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
};

export default nextConfig;
