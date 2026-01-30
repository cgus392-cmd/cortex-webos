
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    define: {
      // Forzamos la variable también en el build por si acaso, aunque ya está hardcoded en el código
      'process.env.API_KEY': JSON.stringify("AIzaSyDiSXYLe-zqKCqtfUSPAZJ9qOzTkK8JsCk"),
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Desactivar sourcemaps en producción para seguridad
      minify: 'esbuild',
    }
  };
});
