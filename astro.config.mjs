import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vue from '@astrojs/vue';

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  integrations: [
    preact(), 
    vue(),
    sitemap()
  ],
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
});