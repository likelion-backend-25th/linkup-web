import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin =
    env.VITE_API_PROXY_TARGET || env.VITE_API_ORIGIN || 'http://13.125.86.44'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      watch: {
        ignored: ['**/.cursor/**'],
      },
      proxy: {
        '/api/v1': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/oauth2': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
