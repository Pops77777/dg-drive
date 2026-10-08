export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(url.pathname + url.search, "https://dgx-cloud-pmz8.onrender.com");
      const reqHeaders = new Headers(request.headers);
      reqHeaders.set("Host", "dgx-cloud-pmz8.onrender.com");
      reqHeaders.set("X-Forwarded-Host", url.host);
      reqHeaders.set("X-Forwarded-Proto", "https");

      try {
        const response = await fetch(backendUrl.toString(), {
          method: request.method,
          headers: reqHeaders,
          body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
          redirect: "manual",
        });

        const resHeaders = new Headers(response.headers);
        resHeaders.set("Access-Control-Allow-Origin", url.origin);
        resHeaders.set("Access-Control-Allow-Credentials", "true");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: resHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Backend connecting, please try again in a few seconds." }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
