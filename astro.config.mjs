import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";
import bun from "@nurodev/astro-bun";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  server: {
    host: true,
  },
  adapter: bun(),
  output: "server",
  prefetch: false,
  devToolbar: {
    enabled: false
  },
  integrations: [tailwind(), react()]
});