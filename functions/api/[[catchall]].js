// MASTER / PRIMARY RENDER SERVER (Handles Auth, Database, File Lists)
const PRIMARY_BACKEND = "https://dgx-cloud.onrender.com";

// POOL OF RENDER STREAMING NODES (Each node adds 100 GB Free Bandwidth = Up to 1 TB / Month!)
export const STREAMING_NODES = [
  "https://dgx-cloud.onrender.com",
  "https://dgx-cloud-node2.onrender.com",
  "https://dgx-cloud-node3.onrender.com",
  "https://dgx-cloud-node4.onrender.com",
  "https://dgx-cloud-node5.onrender.com",
  "https://dgx-cloud-node6.onrender.com",
  "https://dgx-cloud-node7.onrender.com",
  "https://dgx-cloud-node8.onrender.com",
  "https://dgx-cloud-node9.onrender.com",
  "https://dgx-cloud-node10.onrender.com",
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isMedia = Boolean(url.pathname.match(/^\/api\/files\/[0-9a-f-]{36}/i)) && ["GET", "HEAD"].includes(context.request.method);
  const targetNodes = isMedia && STREAMING_NODES.length > 0 ? STREAMING_NODES : [PRIMARY_BACKEND];
  const startIndex = isMedia ? Math.floor(Math.random() * targetNodes.length) : 0;

  let lastResponse = null;

  for (let i = 0; i < targetNodes.length; i++) {
    const nodeBase = targetNodes[(startIndex + i) % targetNodes.length];
    const backendUrl = new URL(url.pathname + url.search, nodeBase);
    const reqHeaders = new Headers(context.request.headers);
    reqHeaders.set("Host", backendUrl.host);
    reqHeaders.set("X-Forwarded-Host", url.host);
    reqHeaders.set("X-Forwarded-Proto", "https");

    try {
      const fetchOptions = {
        method: context.request.method,
        headers: reqHeaders,
        body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
        redirect: "manual",
      };
      if (isMedia) {
        fetchOptions.cf = {
          cacheEverything: true,
          cacheTtl: 86400 * 30, // 30 days edge cache
        };
      }
      const response = await fetch(backendUrl.toString(), fetchOptions);

      if (isMedia && [429, 502, 503, 504].includes(response.status) && targetNodes.length > 1) {
        lastResponse = response;
        continue;
      }

      const resHeaders = new Headers(response.headers);
      resHeaders.set("Access-Control-Allow-Origin", url.origin);
      resHeaders.set("Access-Control-Allow-Credentials", "true");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      continue;
    }
  }

  return lastResponse || new Response(JSON.stringify({ error: "Storage backend connecting, please retry in 5 seconds." }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
