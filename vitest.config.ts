import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/{unit,component}/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['test/component/platform/setup.ts'],
    exclude: ['node_modules', '.claude'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
