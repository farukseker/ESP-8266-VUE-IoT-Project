import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100,
    rollupOptions: {
      output: {
        entryFileNames: 'm.js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') {
            return 'v.js';
          }
          return '[name].js';
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo?.name) {
            return '[name].[ext]';
          }
          
          if (assetInfo.name.endsWith('.css')) {
            return 's.css';
          }
          
          if (assetInfo.name.endsWith('.woff') || assetInfo.name.endsWith('.woff2')) {
            return 'fonts/[name].[ext]';
          }
          
          return '[name].[ext]';
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})