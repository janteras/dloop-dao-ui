import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Error overlay plugin removed

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Proxy Netlify functions requests to avoid HTML responses
      '/.netlify/functions/': {
        target: 'http://localhost:9999', // Default Netlify Functions dev server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
        },
      },
    },
  },
});
