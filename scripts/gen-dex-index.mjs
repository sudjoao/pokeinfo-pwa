#!/usr/bin/env node
/**
 * Gera src/data/generated/dexIndex.ts: o índice da Pokédex (id + nome de cada Pokémon/forma) e os
 * tipos de cada um, das mesmas rotas REST que o app usava em tempo de execução
 * (`/pokemon?limit=100000` e os 18 `/type/{nome}`).
 *
 * Com isso embutido, a lista e o detalhe abrem sem as 19 requisições (~70 KB comprimidos) da
 * primeira visita nem a leitura de ~60 KB do localStorage nas seguintes. Pokémon lançados depois
 * do build ainda aparecem: o app confere o índice em segundo plano (stores/pokedex.ts).
 *
 * Uso: node scripts/gen-dex-index.mjs [--check]  (Node 22+, sem dependências)
 * Rodar de novo quando a PokéAPI ganhar Pokémon/formas novas.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const REST = 'https://pokeapi.co/api/v2'
const OUT = fileURLToPath(new URL('../src/data/generated/dexIndex.ts', import.meta.url))
const CHECK = process.argv.includes('--check')

/** Mesma ordem de POKEMON_TYPES (src/types/pokemon.ts): a letra é o índice ('a' = normal). */
const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'stellar', 'unknown',
]
/** stellar e unknown não listam nenhum Pokémon. */
const LISTED_TYPES = POKEMON_TYPES.filter((type) => type !== 'stellar' && type !== 'unknown')

async function rest(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${REST}/${path}`)
    if (response.ok) return response.json()
    if (attempt >= 3) throw new Error(`REST falhou: ${path} ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
}

const idOf = (url) => Number(url.replace(/\/$/, '').split('/').pop())

async function main() {
  const list = await rest('pokemon?limit=100000&offset=0')
  const entries = list.results
    .map((resource) => ({ id: idOf(resource.url), name: resource.name }))
    .filter((entry) => Number.isFinite(entry.id))
    .sort((a, b) => a.id - b.id)
  if (entries.some((entry) => /\s/.test(entry.name))) throw new Error('Nome com espaço no índice')

  const slots = new Map()
  const responses = await Promise.all(LISTED_TYPES.map((type) => rest(`type/${type}`)))
  responses.forEach((dto, i) => {
    for (const { pokemon, slot } of dto.pokemon) {
      const id = idOf(pokemon.url)
      if (!slots.has(id)) slots.set(id, [])
      slots.get(id).push({ slot, type: POKEMON_TYPES.indexOf(LISTED_TYPES[i]) })
    }
  })

  // Ids em intervalos contínuos ([1, 1025], [10001, ...]): o arquivo não repete cada número.
  const ranges = []
  for (const { id } of entries) {
    const last = ranges[ranges.length - 1]
    if (last && last[1] === id - 1) last[1] = id
    else ranges.push([id, id])
  }

  const letter = (index) => String.fromCharCode(97 + index)
  const types = entries
    .map(({ id }) => {
      const list = (slots.get(id) ?? []).sort((a, b) => a.slot - b.slot).map((s) => letter(s.type))
      return (list.join('') + '--').slice(0, 2)
    })
    .join('')
  const missing = entries.filter(({ id }) => !slots.has(id)).length

  const content = `// Gerado por scripts/gen-dex-index.mjs a partir da PokéAPI (/pokemon e /type). Não editar à mão.

/** Data da geração: Pokémon mais novos que isso vêm da conferência em segundo plano. */
export const DEX_INDEX_DATE = '${new Date().toISOString().slice(0, 10)}'

/** Intervalos [primeiro, último] dos ids do índice, em ordem crescente. */
export const DEX_INDEX_RANGES: readonly (readonly [number, number])[] = ${JSON.stringify(ranges)}

/** Nome (slug) de cada id, na ordem dos intervalos, separados por espaço. */
export const DEX_INDEX_NAMES =
  ${JSON.stringify(entries.map((entry) => entry.name).join(' '))}

/**
 * Tipos de cada id, na mesma ordem: dois caracteres por Pokémon, a letra é o índice em
 * POKEMON_TYPES ('a' = normal), '-' = sem segundo tipo e '--' = fora do mapa de tipos.
 */
export const DEX_INDEX_TYPES =
  ${JSON.stringify(types)}
`

  if (CHECK) {
    const current = await readFile(OUT, 'utf8').catch(() => '')
    const strip = (text) => text.replace(/DEX_INDEX_DATE = '[^']*'/, '')
    console.log(strip(current) === strip(content) ? 'Sem mudanças.' : 'dexIndex.ts mudou: rode sem --check.')
  } else {
    await writeFile(OUT, content)
    console.log(`dexIndex.ts: ${entries.length} entradas, ${missing} sem tipos, ${content.length} bytes`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
