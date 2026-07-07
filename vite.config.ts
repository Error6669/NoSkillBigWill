import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // ES-Module-Skripte (type="module") werden von Browsern immer im
    // CORS-Modus geladen - unter file:// scheitert das (jede lokale Datei
    // gilt als eigene Quelle). Deshalb hier alles zu einem einzigen
    // klassischen Skript ohne Code-Splitting bündeln, das ohne CORS auskommt.
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
