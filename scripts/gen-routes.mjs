#!/usr/bin/env node
/**
 * Gera src/data/routes.ts: por jogo, os locais com pelo menos um encontro (selvagem, presente ou
 * troca) e as áreas da PokéAPI que sustentam cada um.
 *
 * A PokéAPI não diz quais dos ~90 a ~130 locais de cada região têm encontro; só `/location-area`
 * tem. Por isso o script varre o REST: região -> locais -> áreas (~1700 requisições, ~8 em
 * paralelo, alguns minutos). O GraphQL beta faria numa consulta, mas está desatualizado aqui
 * (faltam áreas como o Prize Corner de Celadon e alguns locais têm outro slug). Os jogos e as
 * versões de cada um (com os alias das DLCs) vêm de src/data/games.ts, importado direto (o Node
 * remove os tipos do .ts).
 *
 * Uso: node scripts/gen-routes.mjs [--check]
 *   --check compara com o arquivo atual e não escreve (sai com código 1 se houver diferença).
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games.ts'

const REST = 'https://pokeapi.co/api/v2'

/**
 * Erros conhecidos de dado da PokéAPI (conferidos em 2026-10-23): o local aparece num jogo em que
 * não existe (Tornadus/Thundurus no QG da Team Flare marcados como Black/White; Voltorb em New
 * Mauville marcado como Sun).
 */
const IGNORED = {
  'black-white': ['team-flare-secret-hq'],
  'sun-moon': ['new-mauville'],
}
const CONCURRENCY = 8
const OUT = fileURLToPath(new URL('../src/data/routes.ts', import.meta.url))

/** Regiões com dado de encontro na PokéAPI (as dos jogos com `hasEncounterData`). */
const REGIONS = new Set(['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar'])

async function rest(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(path.startsWith('http') ? path : `${REST}/${path}`)
    if (response.ok) return response.json()
    if (attempt >= 4) throw new Error(`REST falhou: ${path} ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
  }
}

/** Executa `task` em todos os itens com no máximo CONCURRENCY ao mesmo tempo, mantendo a ordem. */
async function mapLimit(items, task) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

/** "route-2" antes de "route-10": compara números dentro do texto pelo valor. */
function naturalCompare(a, b) {
  return a.localeCompare(b, 'en', { numeric: true })
}

/** Áreas das regiões, na ordem da API, com as versões em que cada uma tem algum encontro. */
async function loadAreas() {
  const regions = await mapLimit([...REGIONS], (region) => rest(`region/${region}`))
  const locations = regions.flatMap((region) =>
    region.locations.map((location) => ({ name: location.name, url: location.url })),
  )
  const details = await mapLimit(locations, (location) => rest(location.url))
  const areaRefs = details.flatMap((location) =>
    location.areas.map((area) => ({
      location: location.name,
      region: location.region?.name ?? '',
      name: area.name,
      url: area.url,
    })),
  )
  process.stderr.write(`${locations.length} locais, ${areaRefs.length} áreas\n`)
  const areas = await mapLimit(areaRefs, async (ref) => {
    const area = await rest(ref.url)
    const versions = new Set(
      area.pokemon_encounters.flatMap((p) => p.version_details.map((v) => v.version.name)),
    )
    return { location: ref.location, region: ref.region, name: ref.name, versions }
  })
  return areas
}

function buildRoutes(areas) {
  const result = {}
  for (const game of GAMES.filter((g) => g.hasEncounterData)) {
    const versions = new Set(game.versions.flatMap((v) => [v.slug, ...(v.aliases ?? [])]))
    const byLocation = new Map()
    const regionCount = new Map()
    for (const area of areas) {
      if (![...area.versions].some((version) => versions.has(version))) continue
      if (IGNORED[game.slug]?.includes(area.location)) continue
      if (!byLocation.has(area.location)) {
        byLocation.set(area.location, { region: area.region, areas: [] })
        regionCount.set(area.region, (regionCount.get(area.region) ?? 0) + 1)
      }
      byLocation.get(area.location).areas.push(area.name)
    }
    // A região do jogo (a com mais locais) vem antes das outras (ex.: Kanto depois de Johto em
    // Gold/Silver); dentro de cada região, ordem natural. As áreas ficam na ordem da API.
    const main = [...regionCount].sort((a, b) => b[1] - a[1])[0]?.[0]
    const rank = (region) => (region === main ? 0 : 1)
    result[game.slug] = [...byLocation]
      .sort(([a, x], [b, y]) => rank(x.region) - rank(y.region) || naturalCompare(a, b))
      .map(([location, entry]) => ({ location, areas: entry.areas }))
  }
  return result
}

function render(routes) {
  const games = Object.entries(routes)
    .map(([game, list]) => {
      const items = list
        .map((r) => `    { location: ${JSON.stringify(r.location)}, areas: ${JSON.stringify(r.areas)} },`)
        .join('\n')
      return `  ${JSON.stringify(game)}: [\n${items}\n  ],`
    })
    .join('\n')
  return `/**
 * Locais com pelo menos um encontro selvagem (ou presente/troca fixa) por jogo, com as áreas
 * da PokéAPI que sustentam cada um.
 *
 * Gerado por scripts/gen-routes.mjs (não editar à mão): a PokéAPI não diz quais dos ~90 a ~130
 * locais de cada região têm encontro, só \`/location-area\`. Cruza as áreas das 8 regiões com dado
 * de encontro com as versões de cada jogo em \`data/games.ts\` (incluindo os alias de DLC, ex.:
 * "the-isle-of-armor-sword"). Cidades, prédios e locais sem nenhuma versão do jogo ficam de fora.
 *
 * Locais com várias áreas (covis de Dynamax, andares de caverna) somam os pokémon de todas elas
 * numa lista só ao expandir a rota.
 */

export interface GameRoute {
  /** Slug do local na PokéAPI (ex.: "kanto-route-1"), formatado na tela com \`formatAreaName\`. */
  location: string
  /** Áreas (\`/location-area/{slug}\`) somadas para montar a lista de pokémon deste local. */
  areas: readonly string[]
}

/** Chave: slug do jogo em \`data/games.ts\`. Jogos com \`hasEncounterData: false\` não aparecem. */
export const GAME_ROUTES: Readonly<Record<string, readonly GameRoute[]>> = {
${games}
}
`
}

async function main() {
  const routes = buildRoutes(await loadAreas())
  if (process.argv.includes('--check')) {
    const { GAME_ROUTES } = await import(`${OUT}?t=${Date.now()}`)
    const current = JSON.stringify(GAME_ROUTES)
    const next = JSON.stringify(routes)
    if (current === next) {
      console.log('routes.ts já está igual ao gerado.')
      return
    }
    for (const game of new Set([...Object.keys(GAME_ROUTES), ...Object.keys(routes)])) {
      const a = (GAME_ROUTES[game] ?? []).map((r) => `${r.location}:${r.areas.join('+')}`)
      const b = (routes[game] ?? []).map((r) => `${r.location}:${r.areas.join('+')}`)
      const removed = a.filter((x) => !b.includes(x))
      const added = b.filter((x) => !a.includes(x))
      if (removed.length || added.length || a.join() !== b.join()) {
        console.log(`${game}: ${a.length} -> ${b.length} locais; -${removed.length} +${added.length}`)
        for (const x of removed.slice(0, 5)) console.log('   -', x)
        for (const x of added.slice(0, 5)) console.log('   +', x)
      }
    }
    process.exitCode = 1
    return
  }
  await writeFile(OUT, render(routes))
  console.log(`routes.ts: ${Object.values(routes).reduce((n, list) => n + list.length, 0)} locais`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
