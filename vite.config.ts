import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function pagesBase(): string {
  const fromEnv = process.env.BASE_PATH
  if (!fromEnv) return '/'
  return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
}

export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
