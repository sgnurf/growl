import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
    plugins: [sveltekit(), tailwindcss()],
    resolve: {
        // In test mode, prefer browser exports so Svelte resolves to its browser
        // build instead of the SSR build (index-server.js), which lacks mount().
        conditions: mode === 'test' ? ['browser'] : undefined
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./setupTest.js']
    }
}));
