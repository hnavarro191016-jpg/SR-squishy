import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite que cualquier celular en la misma red Wi-Fi se conecte al POS
    port: 5173
  }
});
