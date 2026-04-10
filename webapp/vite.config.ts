import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
    env: {
      VITE_FIREBASE_API_KEY: 'AIzaSyDummyKeyForTesting',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
    },
  },
})
