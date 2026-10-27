import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AlugaFácil Pro',
    short_name: 'AlugaFácil',
    description: 'Portal de aluguel de imóveis em Presidente Dutra e Maranhão',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#17324D',
    theme_color: '#17324D',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
