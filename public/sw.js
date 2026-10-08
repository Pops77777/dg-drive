// DGx Cloud Media Stream Service Worker (Direct Client-Side Cache & Acceleration)
const CACHE_NAME = "dgx-media-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/files/") || url.pathname.startsWith("/api/v1/stream/")) {
    if (event.request.method === "GET" && !url.pathname.includes("/thumbnail")) {
      event.respondWith(handleMediaRequest(event.request));
      return;
    }
  }

  event.respondWith(fetch(event.request));
});

async function handleMediaRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = request.url.split("?")[0];
  const rangeHeader = request.headers.get("Range");

  if (!rangeHeader) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse.clone();
    }
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status === 200) {
      cache.put(cacheKey, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  }

  const fullCached = await cache.match(cacheKey);
  if (fullCached) {
    const arrayBuffer = await fullCached.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const totalLength = bytes.length;

    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalLength - 1;
      const sliced = bytes.subarray(start, Math.min(end + 1, totalLength));

      return new Response(sliced, {
        status: 206,
        statusText: "Partial Content",
        headers: {
          "Content-Range": `bytes ${start}-${Math.min(end, totalLength - 1)}/${totalLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(sliced.length),
          "Content-Type": fullCached.headers.get("Content-Type") || "video/mp4",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return fetch(request);
}
