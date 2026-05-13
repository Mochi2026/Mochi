// ── Mochi SW v5 ──
// Cambiá este número cada vez que subas cambios al index.html
// para que todos los usuarios reciban la versión nueva.
const CACHE = 'mochi-v5';

const STATIC = [
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css',
];

// Instalar: pre-cachear solo recursos estáticos externos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

// Activar: borrar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para index.html, cache-first para el resto
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // index.html y navegación → siempre red primero, caché como fallback
  const isNavigation = e.request.mode === 'navigate'
    || url.pathname === '/'
    || url.pathname.endsWith('index.html');

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Guardar copia fresca en caché
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./')))
    );
    return;
  }

  // Recursos estáticos (fuentes, iconos) → caché primero
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./'));
    })
  );
});
