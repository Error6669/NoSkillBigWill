import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Der Build wird bewusst als klassisches IIFE-Bundle erzeugt (siehe
// vite.config.ts), damit die App über file:// geöffnet werden kann: ES-Module
// (type="module") werden von Browsern immer im CORS-Modus geladen, und unter
// file:// gilt jede lokale Datei als eigene Quelle - das schlägt dort immer
// fehl ("CORS-Anfrage war nicht http"). Vite schreibt das type="module"- und
// crossorigin-Attribut aber unabhängig vom Rollup-Output-Format fest in die
// HTML, deshalb werden beide hier nach dem Build entfernt.
const distIndexPath = path.resolve(fileURLToPath(import.meta.url), '../../dist/index.html')

const html = readFileSync(distIndexPath, 'utf-8')
const stripped = html
  .replace(/\s+crossorigin(="[^"]*")?/g, '')
  // type="module" impliziert defer-Timing (Skript läuft erst nach dem
  // HTML-Parsing). Ohne type="module" muss defer explizit gesetzt werden,
  // sonst läuft das Skript zu früh, bevor <div id="root"> existiert.
  .replace(/<script ([^>]*)type="module"([^>]*)>/, '<script $1defer$2>')
writeFileSync(distIndexPath, stripped)
