import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Testes das funções puras (utils, data): sem DOM nem plugins do Vite (PWA, Vuetify, i18n).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/*.spec.ts'],
  },
})
