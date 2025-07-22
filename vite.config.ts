import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // 브라우저에서 global을 globalThis로 대체
      },
      plugins: [
        (NodeGlobalsPolyfillPlugin as any).default({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  define: {
    global: 'globalThis',
  },
})
