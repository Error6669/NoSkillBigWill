import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Zwei Build-Ziele:
// 1. Lokaler file://-Build (Standard, "npm run build"): base relativ ("./")
//    und ein einziges klassisches IIFE-Bundle statt ES-Modulen, weil Browser
//    ES-Module (type="module") immer im CORS-Modus laden - unter file://
//    scheitert das, da jede lokale Datei als eigene Quelle gilt.
// 2. GitHub-Pages-Build ("npm run build:pages"): läuft über echtes https,
//    dort sind normale ES-Module + Code-Splitting unproblematisch und sogar
//    besser (kleinere Downloads). Der Unterpfad (z.B. "/REPO_NAME/") kommt
//    über die Umgebungsvariable GITHUB_PAGES_BASE (siehe
//    .github/workflows/deploy.yml), die dort automatisch aus dem
//    Repository-Namen gesetzt wird.
const pagesBase = process.env.GITHUB_PAGES_BASE

export default defineConfig({
  base: pagesBase ?? './',
  plugins: [react()],
  build: pagesBase
    ? {}
    : {
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
