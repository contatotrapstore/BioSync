import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@cap': path.resolve(__dirname, './src/capacitor'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production build size
    minify: 'esbuild', // Use esbuild for faster builds
    target: 'es2022',
    chunkSizeWarningLimit: 1000 // Increase limit for mobile app with games
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true // Allow access from local network for mobile testing
  }
})
