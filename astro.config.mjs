import bun from 'astro-bun-adapter';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    server: {
        host: true,
    },
    vite: {
        envPrefix: 'PUBLIC_',
    },
    prefetch: false,
    adapter: bun(),
});
