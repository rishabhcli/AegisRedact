import { generateSW } from 'workbox-build';

/**
 * Workbox service worker configuration following best practices from Context7 docs
 * @see https://developer.chrome.com/docs/workbox/
 */
const swConfig = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,webmanifest,png,svg,woff2,mjs}'],
  globIgnores: [
    '**/node_modules/**',
    '**/*.map', // Exclude source maps
    '**/sw.js' // Don't cache the service worker itself
  ],
  swDest: 'dist/sw.js',

  // Activate immediately for seamless updates
  skipWaiting: true,
  clientsClaim: true,

  // Source map generation (disabled for production)
  sourcemap: false,

  // Offline fallback configuration
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/, /^\/__/],

  // Runtime caching strategies (per Context7 best practices)
  runtimeCaching: [
    // Google Fonts stylesheets - StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    // Google Fonts webfonts - CacheFirst with long expiration
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Images - CacheFirst with expiration
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 3600 // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Fonts - CacheFirst with long expiration
    {
      urlPattern: ({ request }) => request.destination === 'font',
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 3600 // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // PDF.js worker - CacheFirst
    {
      urlPattern: /pdf\.worker\.min\.mjs$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pdf-worker',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 30 * 24 * 3600 // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Tesseract.js resources - CacheFirst (large, rarely changes)
    {
      urlPattern: /tesseract|traineddata/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tesseract-resources',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 3600 // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // External CDN resources - StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/cdn\./,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'external-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 3600 // 1 day
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
});

console.log(`Service worker generated successfully at ${swConfig.filePath}`);
console.log(`Precached ${swConfig.count} files, totaling ${swConfig.size} bytes`);

if (swConfig.warnings.length > 0) {
  console.warn('Warnings:', swConfig.warnings.join('\n'));
}
