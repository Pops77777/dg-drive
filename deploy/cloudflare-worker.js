// Cloudflare Worker for DGx Cloud (100% Unlimited Bandwidth & Edge CDN Caching)
// Deploy this to Cloudflare Workers (Free Plan, 0 Cost, Unlimited Bandwidth)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetOrigin = "https://dgx-cloud.onrender.com";
    const targetUrl = new URL(url.pathname + url.search, targetOrigin);

    const isMedia = url.pathname.startsWith("/api/files/") || url.pathname.startsWith("/api/v1/stream/");
    const cache = caches.default;

    // Check Cloudflare Edge Cache for media streaming chunks
    if (isMedia && request.method === "GET") {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }

    // Forward original request headers
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "dgx-cloud.onrender.com");
    newHeaders.set("X-Forwarded-Host", url.host);
    newHeaders.set("X-Forwarded-Proto", "https");
    if (newHeaders.has("origin")) {
      newHeaders.set("Origin", targetOrigin);
    }

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "follow",
    });

    const response = await fetch(modifiedRequest);

    const newResponseHeaders = new Headers(response.headers);
    newResponseHeaders.set("Access-Control-Allow-Origin", "*");
    newResponseHeaders.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    if (isMedia) {
      newResponseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newResponseHeaders,
    });

    // Save media chunks to Cloudflare Unlimited Edge Cache
    if (isMedia && (response.status === 200 || response.status === 206)) {
      ctx.waitUntil(cache.put(request, modifiedResponse.clone()));
    }

    return modifiedResponse;
  },
};
