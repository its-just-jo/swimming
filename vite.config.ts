import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' erzeugt relative Asset-Pfade. Damit laeuft der Build sowohl unter
// https://<user>.github.io/<repo>/ als auch von beliebigem Webspace.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: true },
});
