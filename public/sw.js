const CACHE_NAME = 'trader-pro-v1';
const DATA_CACHE_NAME = 'trader-pro-data-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests to external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API calls for historical data
  if (event.request.url.includes('/stock/') && event.request.url.includes('/history')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Check if cached response is still valid (less than 5 minutes old)
            const cacheTime = new Date(response.headers.get('sw-cache-time'));
            if (Date.now() - cacheTime.getTime() < 5 * 60 * 1000) {
              console.log('📦 Serving cached API response');
              return response;
            }
          }
          
          // Fetch fresh data from network
          return fetch(event.request).then((networkResponse) => {
            // Clone the response to cache it
            const responseToCache = networkResponse.clone();
            
            // Add cache timestamp header
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', new Date().toISOString());
            
            const cachedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });
            
            // Cache the response
            cache.put(event.request, cachedResponse);
            console.log('💾 Cached new API response');
            
            return networkResponse;
          }).catch((error) => {
            // If network fails, try to serve stale cache
            console.log('🌐 Network failed, trying stale cache');
            return cache.match(event.request).then((staleResponse) => {
              if (staleResponse) {
                console.log('📦 Serving stale cached response');
                return staleResponse;
              }
              throw error;
            });
          });
        });
      }).catch((error) => {
        console.error('Service worker cache error:', error);
        // Fallback to network request
        return fetch(event.request);
      })
    );
  }
  
  // Handle other requests with network-first strategy for better reliability
  else {
    event.respondWith(
      fetch(event.request).then((response) => {
        // Only cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch((error) => {
        console.log('Network request failed, trying cache:', error);
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache, return a basic error response
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      console.log('🔄 Background sync triggered')
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New data available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Chart',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Trader Pro', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/charts')
    );
  }
}); 