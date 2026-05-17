import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/community', '/shared/'],
      disallow: [
        '/api/',
        '/library/',
        '/admin/',
        '/doc/',
        '/rooms/',
        '/settings/',
        '/upload/',
        '/login',
        '/register',
        '/reset-password',
      ],
    },
    sitemap: 'https://mindex.io.vn/sitemap.xml',
  }
}
