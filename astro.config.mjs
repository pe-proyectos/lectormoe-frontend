import bun from 'astro-bun-adapter';
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    host: true
  },
  prefetch: false,
  adapter: bun(),
  integrations: [tailwind(), react()]
});
