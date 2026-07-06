// Service worker minimal — rend l'app installable sans AUCUN cache :
// tout passe par le réseau, donc jamais de version périmée après un déploiement.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passthrough réseau */ });
