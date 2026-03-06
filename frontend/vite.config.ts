import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': {
         target: env.BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
       '/socket.io': {
         target: env.BACKEND_URL || 'http://localhost:4000',
         ws: true,
         changeOrigin: true,
         secure: false,
       },
    },
    },
  };
});
