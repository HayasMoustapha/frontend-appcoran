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
      '192.168.1.179'
    ],
    hmr: {
      host: 'appcoran.com',
      clientPort: 80,
      protocol: 'ws'
    }
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
