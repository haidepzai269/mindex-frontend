import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/community'],
      disallow: [
        '/api/',
        '/settings/',
        '/library/',
        '/doc/',
        '/admin/',
        '/login',
        '/register',
        '/reset-password',
      ],
    },
    sitemap: 'https://mindex.io.vn/sitemap.xml',
  }
}
