import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts (which is a mode-switching function for the demo /
// lib builds). The security- and round-trip-critical utils touch the DOM
// (DOMParser, <template>, localStorage), so tests run under jsdom (S5).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
