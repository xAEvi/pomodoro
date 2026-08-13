const CACHE_NAME = "pomodoro-v1";

// A propósito NO se llama a skipWaiting() acá. En la primera instalación (sin
// un worker activo previo) esto no cambia nada: el navegador activa igual
// porque no hay nada que esperar. Pero en una actualización, saltar la espera
// automáticamente activaría el worker nuevo mientras una pestaña ya abierta
// sigue corriendo el JS viejo, que puede terminar pidiendo un chunk que el
// deploy nuevo borró. En cambio, el worker nuevo queda "waiting" hasta que el
// usuario confirme desde el banner de actualización (ver mensaje
// SKIP_WAITING más abajo, y el hook useServiceWorkerUpdate).
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones (documento HTML): network-first para no servir una versión
  // vieja de la app mientras haya conexión, con fallback a caché si está offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Assets estáticos (JS/CSS/fuentes/iconos): cache-first, ya que llevan hash
  // en el nombre y son inmutables una vez publicados.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
