import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'

const DIR = 'dev-maps'
const IMAGE = /\.(png|jpe?g|webp|gif)$/i

/**
 * Só no `npm run dev`: lista em `/__dev-maps` as imagens da pasta `dev-maps/` (fora do git), que o
 * painel de referência do mapa (src/dev/) põe por baixo dos marcadores para comparar com o mapa
 * oficial dos jogos. A arte é da Nintendo/The Pokémon Company: não entra no repositório nem no
 * build. As imagens em si o servidor do Vite já entrega pela raiz (`/dev-maps/kanto.png`).
 *
 * No build, uma trava: se algo do painel chegar ao pacote (um import fora do
 * `import.meta.env.DEV`, ou um build com `NODE_ENV=development`), o build falha em vez de publicar.
 */
export function devMaps(): Plugin[] {
  return [
    {
      name: 'pokeinfo:dev-maps',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__dev-maps', async (_request, response) => {
          let files: string[] = []
          try {
            files = (await readdir(join(server.config.root, DIR))).filter((file) =>
              IMAGE.test(file),
            )
          } catch {
            // Sem a pasta: lista vazia, e o painel explica onde colocar as imagens.
          }
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(files.sort()))
        })
      },
    },
    {
      name: 'pokeinfo:dev-maps-guard',
      apply: 'build',
      generateBundle(_options, bundle) {
        for (const [fileName, output] of Object.entries(bundle)) {
          const leaked =
            output.type === 'chunk'
              ? output.code.includes('/__dev-maps') ||
                output.moduleIds.some((id) => id.includes('/src/dev/'))
              : fileName.startsWith(`${DIR}/`)
          if (leaked) {
            this.error(
              `O painel de mapas de dev (src/dev/, ${DIR}/) foi parar no build em ${fileName}.`,
            )
          }
        }
      },
    },
  ]
}
