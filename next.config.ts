import type { NextConfig } from "next";
import nextPWA from 'next-pwa';

// minimal Next config; include turbopack empty config to avoid Turbopack warnings
const nextConfig: NextConfig = {
  turbopack: {},
  // Note: removed `output: 'export'` because API routes in this app need
  // dynamic server behavior (cookies, DB). Static export prevents API
  // routes from reading request cookies and can cause runtime 500s.
};

// Configure next-pwa
const withPWA = (nextPWA as any)({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
