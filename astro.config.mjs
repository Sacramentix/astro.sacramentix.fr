import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import Icons from 'unplugin-icons/vite';

import vue from "@astrojs/vue";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [sitemap(), vue()],

  vite: {
    ssr: {
      external: ["svgo"]
    },
    plugins: [
      Icons({
        compiler: 'astro'
      })
    ]
  },

  adapter: netlify()
});