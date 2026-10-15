import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { PARSHIYOT_BY_BOOK } from './src/data/parshiyot.ts'

/**
 * Publishes the parashah list (names, references, teaching videos) as /parshiyot.json so the
 * weekly-email worker always uses the same data as the site.
 */
function parshiyotJson(): Plugin {
  const json = () => JSON.stringify(PARSHIYOT_BY_BOOK.flatMap((group) => group.parshiyot.map((p) => ({ ...p, book: group.book }))))
  return {
    name: 'parshiyot-json',
    configureServer(server) {
      server.middlewares.use('/parshiyot.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(json())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'parshiyot.json', source: json() })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), parshiyotJson()],
})
