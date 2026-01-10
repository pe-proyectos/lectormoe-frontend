import { defineConfig } from 'astro/config';

import tailwindcss from "@tailwindcss/vite";
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
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@nivo/line',
        '@nivo/bar',
        '@nivo/pie',
        '@nivo/core',
        '@nivo/treemap'
      ]
    },
    ssr: {
      noExternal: ['@nivo/line', '@nivo/bar', '@nivo/pie', '@nivo/core', '@nivo/treemap']
    }
  },
  integrations: [react()]
});