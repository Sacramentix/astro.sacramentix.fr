/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

interface CloudflareEnv {
  VISITORS_KV: KVNamespace;
}

declare module "cloudflare:workers" {
  const env: CloudflareEnv;
}
