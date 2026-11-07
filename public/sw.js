// OmniChat AI — Progressive Web App Service Worker
const CACHE_NAME = "omnichat-cache-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first for pages and API; cache-fallback for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests and external URLs
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API calls: Network-only with timeout fallback
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets (images, icons, fonts)
  if (
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML Navigation: Network-first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return (
              cached ||
              new Response(
                `<!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>OmniChat AI - Đang Offline</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; padding: 20px; }
                    .card { background: white; padding: 32px 24px; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 360px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
                    .icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 12px; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 28px; }
                    h1 { font-size: 18px; margin: 0 0 8px; font-weight: 700; color: #0f172a; }
                    p { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px; }
                    button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; width: 100%; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="icon">📡</div>
                    <h1>Không có kết nối Internet</h1>
                    <p>Ứng dụng OmniChat cần mạng để cập nhật tin nhắn mới nhất từ khách hàng. Dữ liệu đã lưu trước đó vẫn an toàn.</p>
                    <button onclick="window.location.reload()">Thử kết nối lại</button>
                  </div>
                </body>
                </html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
              )
            );
          });
        })
    );
  }
});

// Push Notification Handling
self.addEventListener("push", (event) => {
  let payload = {
    title: "OmniChat AI — Tin nhắn mới",
    body: "Khách hàng vừa gửi tin nhắn mới hoặc yêu cầu lịch hẹn.",
    url: "/inbox",
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || "/inbox",
    },
    actions: [
      { action: "open", title: "Mở xem ngay" },
      { action: "close", title: "Bỏ qua" },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification Click Handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/inbox";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
