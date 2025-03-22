import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            }
        }
    },
    server: {
        open: true,
        port: 5190
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
}); 