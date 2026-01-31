
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno desde el sistema (Vercel) o archivo .env
  // El tercer parámetro '' permite cargar variables que no empiecen por VITE_ si fuera necesario,
  // pero aquí buscamos VITE_API_KEY específicamente.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // INYECCIÓN DIRECTA:
      // Vite buscará todas las ocurrencias de __CORTEX_API_KEY__ en el código
      // y las reemplazará por el valor real de la clave (como un string).
      // Si no hay clave, pone un string vacío para evitar crasheos.
      '__CORTEX_API_KEY__': JSON.stringify(env.VITE_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ""),
    },
    build: {
      outDir: 'dist',
      sourcemap: false, 
      minify: 'esbuild',
    }
  };
});
