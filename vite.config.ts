import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Multi-entry: popup (index.html) and background (service worker)
      input: {
        popup: new URL('index.html', import.meta.url).pathname,
        background: new URL('src/background.ts', import.meta.url).pathname,
      },
      output: {
        // Ensure deterministic names suitable for manifest references
        entryFileNames: ({ name }) => {
          if (name === 'background') return 'background.js';
          return '[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: ({ name }) => {
          // Keep top-level filenames clean, other assets under assets/
          if (name && /\.(css)$/.test(name)) return '[name][extname]';
          return 'assets/[name][extname]';
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
