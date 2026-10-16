import type { MetadataRoute } from 'next'

/** Web app manifest so NoBrainy installs to the home screen and opens at Today. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NoBrainy',
    short_name: 'NoBrainy',
    description: 'Your daily loop: plan, focus, learn, reflect.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF6E5',
    theme_color: '#1B1D33',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Plan the day', url: '/planner' },
      { name: 'Close the day', url: '/reviews/daily' },
      { name: 'Tasks', url: '/tasks' },
    ],
  }
}
