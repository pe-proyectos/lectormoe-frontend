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
  // Prefetch: al empezar a tocar un enlace ya se descarga la página siguiente,
  // así el cambio de vista se siente instantáneo. 'hover' = touchstart en móvil
  // (bajo consumo de datos). Combinado con ClientRouter (transiciones de vista)
  // la navegación no recarga toda la página ni parpadea.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
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