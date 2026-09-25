// Service worker do Meu Tempo: torna o app instalável e guarda os arquivos estáticos.
const CACHE = "meu-tempo-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/static/")) {
    // Estáticos: responde do cache e atualiza em segundo plano.
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }
  // Páginas: sempre a versão nova do servidor; sem servidor, mostra um aviso.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => new Response(
      "<meta charset=utf-8><body style='font-family:sans-serif;padding:48px'><h2>Meu Tempo está fechado</h2><p>Abra o programa novamente pelo atalho e recarregue esta janela.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } })));
  }
});
