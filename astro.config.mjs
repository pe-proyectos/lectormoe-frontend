import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    server: {
        host: true,
    },
    prefetch: false,
    adapter: node({
        mode: 'standalone',
    }),
});
