import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

// Pages to track
const TRACKED_PATHS = ["/", "/cv", "/ressources"];
const TRACKED_PREFIXES = ["/mon-cv/"];

function isTrackedPath(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/$/, "") || "/";
  if (TRACKED_PATHS.includes(cleanPath)) return true;
  for (const prefix of TRACKED_PREFIXES) {
    if (cleanPath.startsWith(prefix)) return true;
  }
  return false;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const pathname = url.pathname;

  // Only track GET requests to tracked pages
  if (context.request.method === "GET" && isTrackedPath(pathname)) {
    const kv: KVNamespace | undefined = env?.VISITORS_KV;

    if (kv) {
      const cleanPath = pathname.replace(/\/$/, "") || "/";
      const today = getToday();
      const key = `visits:${today}:${cleanPath}`;

      try {
        const current = await kv.get(key);
        const count = current ? parseInt(current, 10) + 1 : 1;
        // Store with TTL of 8 days (7 days of data + 1 day buffer)
        await kv.put(key, String(count), { expirationTtl: 691200 });
      } catch (e) {
        // Silently fail - don't break the request
        console.error("Failed to track visit:", e);
      }
    }
  }

  return next();
});