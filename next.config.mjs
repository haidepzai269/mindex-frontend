/** @type {import('next').NextConfig} */

// Extract origin only (strip path) so CSP connect-src matches all subpaths
const _apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const apiOrigin = (() => { try { return new URL(_apiUrl).origin; } catch { return _apiUrl; } })();
const wsOrigin = apiOrigin.replace(/^https/, 'wss').replace(/^http/, 'ws');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://unpkg.com blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
      `connect-src 'self' ${apiOrigin} ${wsOrigin} https://prod.spline.design https://unpkg.com https://apis.spline.design https://hooks.spline.design https://www.gstatic.com https://relayserver.spline.design`,
      "worker-src 'self' blob:",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
