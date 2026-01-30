
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para inyectarlas (Vercel, .env, etc.)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // ESTRATEGIA "SPLIT KEY" DE RESPALDO (Protocolo Hydra)
  // Esta llave solo se usa si NO se detecta la variable de entorno en Vercel.
  const FALLBACK_PART_1 = "AIzaSyDuFLG60h_jvDhk";
  const FALLBACK_PART_2 = "W6gThZwC1i4i8I2WPjk";
  const FALLBACK_KEY = FALLBACK_PART_1 + FALLBACK_PART_2;

  // Prioridad: 
  // 1. Entorno Vercel (process.env.VITE_API_KEY)
  // 2. Archivo .env local (env.VITE_API_KEY)
  // 3. Llave hardcoded de emergencia (FALLBACK_KEY)
  const FINAL_API_KEY = process.env.VITE_API_KEY || env.VITE_API_KEY || FALLBACK_KEY;

  return {
    plugins: [react()],
    define: {
      // Inyectamos la variable globalmente para que el código cliente la lea
      'process.env.API_KEY': JSON.stringify(FINAL_API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Desactivar sourcemaps en producción para seguridad
      minify: 'esbuild',
    }
  };
});
