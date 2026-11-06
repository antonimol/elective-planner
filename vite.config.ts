/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build works under /elective-planner/ on GitHub Pages and at any other path.
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
