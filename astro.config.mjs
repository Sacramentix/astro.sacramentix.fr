import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import Icons from 'unplugin-icons/vite';

import vue from "@astrojs/vue";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [sitemap(), vue()],

  vite: {
    ssr: {},
    plugins: [
      Icons({
        compiler: 'astro'
      })
    ],
    css: {
      transformer: 'lightningcss',
    },
    build: {
      cssMinify: 'lightningcss',
    },
  },

  adapter: cloudflare(),
});