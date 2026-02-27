import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'appcoran.com',
      'api.appcoran.com',
      'localhost',
      '127.0.0.1',
      '192.168.1.200'
    ],
    hmr: {
      host: 'appcoran.com',
      clientPort: 80,
      protocol: 'ws'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      },
      '/public': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three')) return 'three';
          if (id.includes('@mui') || id.includes('@emotion') || id.includes('@popperjs')) {
            return 'mui';
          }
          if (id.includes('react-router')) return 'router';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
          if (id.includes('date-fns')) return 'date';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('react')) return 'react';
          return 'vendor';
        }
      }
    }
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
