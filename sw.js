// Service Worker do Shithead! Mobile
// Estratégia "rede primeiro": sempre tenta baixar a versão mais nova do GitHub Pages
// e só usa o cache quando estiver offline. Assim, cada atualização publicada
// aparece para os jogadores sem precisar limpar o cache do navegador.
const CACHE_NAME = 'shithead-mobile-v5-b7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './engine.js',
  './game.js',
  './manifest.json',
  'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Bibliotecas externas (PeerJS, QRCode) têm versão fixa: cache primeiro
  if (url.origin !== self.location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
    return;
  }
  // Arquivos do jogo: rede primeiro, cache como reserva offline
  // cache: 'no-cache' = sempre confere no servidor se há versão nova (evita misturar
  // index.html novo com game.js antigo depois de uma atualização)
  event.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
