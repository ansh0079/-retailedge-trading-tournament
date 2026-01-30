// ═══════════════════════════════════════════════════════════════════════════
// SERVICE WORKER - Offline-First Caching Strategy
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'retailedge-v2-debug-pro-v4';
const API_CACHE_PATTERN = /financialmodelingprep\.com|finnhub\.io/;
const CACHEABLE_PATHS = [
    '/stable/quote',
    '/stable/profile',
    '/stable/historical-chart',
    '/stable/earnings'
];

// Install event
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing');
    self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', event => {
    console.log('🔧 Service Worker activating');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - CACHING DISABLED FOR DEBUGGING
self.addEventListener('fetch', event => {
    // Always fetch from network, never use cache
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                // If network fails, return error
                return new Response('Network error', { status: 503 });
            })
    );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Background sync triggered');
        event.waitUntil(
            // Retry failed requests
            // This would integrate with your app's offline queue
            Promise.resolve()
        );
    }
});
