// Service Worker for UIT Knowledge
// Currently a placeholder to prevent 404 errors and provide a foundation for PWA features.

const CACHE_NAME = 'uit-knowledge-v1';

self.addEventListener('install', (event) => {
    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim clients to start controlling them immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic fetch handler - just pass through for now
    // In the future, we can add caching patterns here
    event.respondWith(fetch(event.request));
});
