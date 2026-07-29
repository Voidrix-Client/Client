import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'radix-ui': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-select',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-slider',
                        '@radix-ui/react-tooltip',
                        'sonner',
                        'cmdk',
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 300,
        sourcemap: false,
        reportCompressedSize: false,
    },
    esbuild: {
        drop: ['console', 'debugger'],
    },
    server: {
        port: 3000,
    },
    resolve: {
        alias: {},
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            'framer-motion',
            'lucide-react',
        ],
    },
});