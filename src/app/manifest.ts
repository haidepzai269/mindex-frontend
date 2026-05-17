import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindex - Hoc tap thong minh voi AI',
    short_name: 'Mindex',
    description: 'Nen tang hoc tap AI cho sinh vien va tri thuc tai lieu.',
    start_url: '/library',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
