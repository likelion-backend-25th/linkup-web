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
        // 업로드 파일은 프론트 배포 도메인에서 열림. 로컬에서도 상세 화면 확인이 되게 같은 경로를 넘긴다.
        '/posts/images': {
          target: 'https://linkup.likelion.shop',
          changeOrigin: true,
        },
        '/posts/files': {
          target: 'https://linkup.likelion.shop',
          changeOrigin: true,
        },
      },
    },
  }
})
