import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
          'src/i18n/i18n.js',
          'src/firebase/admin.js'
      ]
    },
  },
})