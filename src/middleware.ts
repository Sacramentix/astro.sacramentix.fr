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

// Common bot user-agent patterns as fallback
const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /baiduspider/i, /yandexbot/i, /facebot/i, /facebookexternalhit/i,
  /twitterbot/i, /linkedinbot/i, /pinterestbot/i, /discordbot/i,
  /telegrambot/i, /whatsapp/i, /applebot/i, /slackbot/i,
  /petalbot/i, /semrushbot/i, /ahrefsbot/i, /mj12bot/i,
  /dotbot/i, /rogerbot/i, /zoominfobot/i, /trendictionbot/i,
  /bytespider/i, /gptbot/i, /chatgpt-user/i, /ccbot/i,
  /claudebot/i, /anthropic/i, /cohere-ai/i, /perplexitybot/i,
  /archive\.org_bot/i, /ia_archiver/i, /curl/i, /wget/i,
  /headlesschrome/i, /phantomjs/i, /puppeteer/i,
];

function isBot(request: Request): boolean {
  // 1. Check Cloudflare's bot management (Pro+ plans)
  const cf = (request as any).cf;
  if (cf?.botManagement) {
    // verifiedBot: Cloudflare-verified bot (search engines, etc.)
    if (cf.botManagement.verifiedBot) return true;
    // score: 1 (likely bot) to 99 (likely human). Below 30 is suspicious.
    if (typeof cf.botManagement.score === "number" && cf.botManagement.score < 30) return true;
    return false;
  }

  // 2. Fallback: check User-Agent for bot patterns
  const ua = request.headers.get("user-agent") || "";
  if (!ua) return true; // No UA = likely a bot
  if (BOT_UA_PATTERNS.some((re) => re.test(ua))) return true;

  return false;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const pathname = url.pathname;

  // Skip tracking if not a GET, not a tracked path, or it's a bot
  if (context.request.method !== "GET" || !isTrackedPath(pathname) || isBot(context.request)) {
    return next();
  }

  const kv: KVNamespace | undefined = env?.VISITORS_KV;
  if (!kv) return next();

  const cleanPath = pathname.replace(/\/$/, "") || "/";
  const today = getToday();
  const isQr = url.searchParams.has("qr");
  const key = `visits:${today}:${cleanPath}`;

  // Fire-and-forget: run KV updates in the background so the response isn't blocked
  const trackPromise = (async () => {
    try {
      const current = await kv.get(key);
      const count = current ? parseInt(current, 10) + 1 : 1;
      await kv.put(key, String(count), { expirationTtl: 691200 });

      if (isQr) {
        const qrKey = `visits:${today}:${cleanPath}?qr`;
        const qrCurrent = await kv.get(qrKey);
        const qrCount = qrCurrent ? parseInt(qrCurrent, 10) + 1 : 1;
        await kv.put(qrKey, String(qrCount), { expirationTtl: 691200 });
      }
    } catch (e) {
      console.error("Failed to track visit:", e);
    }
  })();

  // Use Cloudflare's waitUntil to keep the worker alive for tracking
  const runtime = context.locals.cfContext;
  if (runtime?.waitUntil) {
    runtime.waitUntil(trackPromise);
  }

  return next();
});
