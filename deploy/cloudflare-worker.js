// Cloudflare Worker for DGx Cloud (100% Unlimited Bandwidth & Super Fast CDN)
// Deploy this to Cloudflare Workers (Free Plan, 0 Cost, Unlimited Bandwidth)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetOrigin = "https://dgx-cloud-pmz8.onrender.com";
    const targetUrl = new URL(url.pathname + url.search, targetOrigin);

    // Forward the original request with all headers, cookies, and range requests
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "dgx-cloud-pmz8.onrender.com");
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

    // Clone response and ensure proper headers
    const newResponseHeaders = new Headers(response.headers);
    newResponseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newResponseHeaders,
    });
  },
};
