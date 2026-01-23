// ═══════════════════════════════════════════════════════════════════════════
// SERVICE WORKER - Offline-First Caching Strategy
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'retailedge-pro-v4';
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

// Fetch event
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Only cache API calls to financial data providers
    if (!API_CACHE_PATTERN.test(url.hostname)) {
        return; // Let browser handle non-API requests
    }

    // Check if path is cacheable
    const isCacheable = CACHEABLE_PATHS.some(path => url.pathname.includes(path));
    if (!isCacheable) {
        return; // Don't cache non-cacheable endpoints
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                // Return cached version if available
                if (response) {
                    console.log('📦 Serving from cache:', url.pathname);

                    // Refresh cache in background (stale-while-revalidate)
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                            console.log('🔄 Updated cache in background:', url.pathname);
                        }
                        return networkResponse;
                    }).catch(() => {
                        console.log('⚠️ Network failed, using cached version');
                    });

                    // Return cached version immediately, but keep background refresh
                    event.waitUntil(fetchPromise);

                    return response;
                }

                // Not in cache, fetch from network
                console.log('🌐 Fetching from network:', url.pathname);
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                        console.log('💾 Cached new response:', url.pathname);
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('❌ Network error:', error);
                    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            });
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
