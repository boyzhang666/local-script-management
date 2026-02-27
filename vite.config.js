import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = parseInt(env.VITE_PORT || '5173', 10)
  const apiPort = parseInt(env.VITE_API_PORT || '3001', 10)

  return {
    plugins: [react()],
    server: {
      // Ensure dev server is reachable via both localhost and 127.0.0.1 on macOS (avoid IPv6-only bind to ::1)
      host: '0.0.0.0',
      port,
      open: `http://localhost:${port}`,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  }
})
