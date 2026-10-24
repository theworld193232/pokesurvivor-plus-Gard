// Network-only worker. The game does not currently ship an offline cache.
// Keep requests on the network so index.html and addon versions stay consistent.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
