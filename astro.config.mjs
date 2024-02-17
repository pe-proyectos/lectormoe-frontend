import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    prefetch: false,
    adapter: node({
        mode: 'standalone',
    }),
});
