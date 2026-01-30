
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para inyectarlas
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Inyectamos la variable para que esté disponible como process.env.API_KEY sin errores
      // Updated Fallback to match Hydra priority
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || "AIzaSyDz1XHDlFzscEe1935chxppQbXl_sm0LR8"),
    },
  };
});
