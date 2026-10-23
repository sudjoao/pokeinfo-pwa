#!/usr/bin/env node
/**
 * Gera os dados de referência de src/data/generated/ a partir da PokéAPI:
 *   - learnsets/{grupo}.ts: quem aprende cada golpe em cada jogo (método e nível). Um arquivo por
 *     grupo de versões (o app baixa só o do jogo aberto), fora do precache do service worker.
 *   - items.ts:            índice dos itens que existem em algum jogo (categoria, bolso, preço,
 *                          nome em espanhol, se é berry e se tem sprite). O efeito vem do
 *                          /item/{slug} ao abrir o item.
 *   - natures.ts:          as 25 naturezas (stat que sobe/desce, sabor preferido/odiado).
 *   - characteristics.ts:  as 30 características ("Adora comer") e o que dizem dos IVs.
 *
 * Os learnsets vêm do GraphQL beta (~1 milhão de linhas, impraticável pelo REST): conferido em
 * 2026-10-23 que ele bate com o REST nos jogos recentes. Legends: Z-A ainda não tem golpes na
 * PokéAPI (nem no REST), então não ganha arquivo. Os itens que o GraphQL não tiver (está atrás do
 * REST) são completados pelo REST, como em gen-pokemon-data.mjs.
 *
 * Uso: node scripts/gen-reference-data.mjs [--check]  (Node 22+, sem dependências)
 *   --check compara com os arquivos atuais e não escreve (sai com código 1 se houver diferença).
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { GAMES } from '../src/data/games.ts'

const ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta'
const REST = 'https://pokeapi.co/api/v2'
const OUT_DIR = fileURLToPath(new URL('../src/data/generated/', import.meta.url))
const LEARNSET_DIR = `${OUT_DIR}learnsets/`
const SPANISH = 7
const ENGLISH = 9
const PAGE = 20000

/** Letra de cada método de aprendizado no arquivo; o resto (formas, eventos…) vira "O". */
const METHOD_LETTER = { 'level-up': 'L', machine: 'M', egg: 'E', tutor: 'T' }

async function query(gql) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: gql }),
    })
    const json = await response.json().catch(() => null)
    if (response.ok && json?.data) return json.data
    if (attempt >= 4) throw new Error(`GraphQL falhou: ${response.status} ${JSON.stringify(json?.errors ?? json)}`)
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
}

async function rest(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${REST}/${path}`)
    if (response.ok) return response.json()
    if (attempt >= 4) throw new Error(`REST falhou: ${path} ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
}

const idOf = (url) => Number(url.replace(/\/$/, '').split('/').pop())

const header = (what) =>
  `// Gerado por scripts/gen-reference-data.mjs a partir da PokéAPI (${what}). Não editar à mão.\n`

// ---- Learnsets ----------------------------------------------------------------------------------

/**
 * Por golpe, os aprendizes num texto compacto: "id em base36 + método + nível em base36" (nível só
 * em "L"), separados por vírgula. Ex.: "pL7,pM" = Pikachu (25) no nível 7 e por TM.
 */
async function learnsets() {
  // Ids dos grupos pelo REST: o GraphQL usa outro slug em alguns (BDSP), mas os ids são os mesmos.
  const vgIndex = await rest('version-group?limit=100')
  const vgById = new Map(vgIndex.results.map((r) => [idOf(r.url), r.name]))
  const wanted = new Set(GAMES.map((g) => g.slug))
  const files = {}
  for (const [id, name] of vgById) {
    if (!wanted.has(name)) continue
    const byMove = new Map()
    for (let offset = 0; ; offset += PAGE) {
      const page = await query(`{
        pokemon_v2_pokemonmove(
          where: { version_group_id: { _eq: ${id} } }
          order_by: [{ move_id: asc }, { pokemon_id: asc }, { move_learn_method_id: asc }, { level: asc }]
          limit: ${PAGE}, offset: ${offset}
        ) {
          pokemon_id level
          pokemon_v2_move { name }
          pokemon_v2_movelearnmethod { name }
        }
      }`)
      const rows = page.pokemon_v2_pokemonmove
      for (const row of rows) {
        const method = METHOD_LETTER[row.pokemon_v2_movelearnmethod.name] ?? 'O'
        const entry = `${row.pokemon_id.toString(36)}${method}${method === 'L' ? row.level.toString(36) : ''}`
        const move = row.pokemon_v2_move.name
        if (!byMove.has(move)) byMove.set(move, new Set())
        byMove.get(move).add(entry)
      }
      if (rows.length < PAGE) break
    }
    if (!byMove.size) {
      process.stderr.write(`${name}: sem golpes na PokéAPI, sem arquivo\n`)
      continue
    }
    const moves = [...byMove].sort(([a], [b]) => a.localeCompare(b))
    const body = moves.map(([move, entries]) => `  ${JSON.stringify(move)}: ${JSON.stringify([...entries].join(','))},`).join('\n')
    files[`${name}.ts`] =
      header(`aprendizes de cada golpe em ${name}`) +
      '\n/** Golpe -> aprendizes ("id base36 + L/M/E/T/O + nível base36 em L"), ver utils/learnsets.ts. */\n' +
      `export const LEARNSET: Readonly<Record<string, string>> = {\n${body}\n}\n`
    process.stderr.write(`${name}: ${moves.length} golpes\n`)
  }
  return files
}

// ---- Itens --------------------------------------------------------------------------------------

async function items() {
  const data = await query(`{
    pokemon_v2_itemcategory(order_by: { id: asc }) { id name pokemon_v2_itempocket { name } }
    pokemon_v2_item(order_by: { id: asc }) {
      id name cost item_category_id
      pokemon_v2_itemnames(where: { language_id: { _eq: ${SPANISH} } }) { name }
      pokemon_v2_itemgameindices_aggregate { aggregate { count } }
      pokemon_v2_itemsprites { sprites }
      pokemon_v2_berries_aggregate { aggregate { count } }
    }
  }`)
  const categories = data.pokemon_v2_itemcategory.map((c) => [c.name, c.pokemon_v2_itempocket?.name ?? 'misc'])
  const categoryIndex = new Map(data.pokemon_v2_itemcategory.map((c, i) => [c.id, i]))
  const rows = data.pokemon_v2_item
    .filter((item) => item.pokemon_v2_itemgameindices_aggregate.aggregate.count > 0)
    .map((item) => {
      const sprite = item.pokemon_v2_itemsprites[0]?.sprites
      const hasSprite = Boolean(typeof sprite === 'string' ? JSON.parse(sprite).default : sprite?.default)
      const berry = item.pokemon_v2_berries_aggregate.aggregate.count > 0
      return [
        item.name,
        categoryIndex.get(item.item_category_id) ?? -1,
        item.cost ?? 0,
        item.pokemon_v2_itemnames[0]?.name ?? '',
        (berry ? 1 : 0) | (hasSprite ? 2 : 0),
      ]
    })

  // O GraphQL fica atrás do REST: itens novos (ex.: os de Legends: Z-A) vêm pelo REST.
  const known = new Set(data.pokemon_v2_item.map((item) => item.name))
  const index = await rest('item?limit=100000')
  const categoryByName = new Map(categories.map(([name], i) => [name, i]))
  for (const { name } of index.results.filter((r) => !known.has(r.name))) {
    const item = await rest(`item/${name}`)
    if (!item.game_indices.length) continue
    let category = categoryByName.get(item.category.name)
    if (category === undefined) {
      const detail = await rest(`item-category/${item.category.name}`)
      categories.push([item.category.name, detail.pocket?.name ?? 'misc'])
      category = categories.length - 1
      categoryByName.set(item.category.name, category)
    }
    rows.push([
      name,
      category,
      item.cost ?? 0,
      item.names.find((n) => n.language.name === 'es')?.name ?? '',
      (name.endsWith('-berry') ? 1 : 0) | (item.sprites?.default ? 2 : 0),
    ])
  }

  return (
    header('itens que existem em algum jogo') +
    `
/** [categoria, bolso] (slugs de /item-category e /item-pocket); o índice é o de \`ItemRow[1]\`. */
export const ITEM_CATEGORIES: readonly (readonly [string, string])[] = ${JSON.stringify(categories)}

/** Bits de \`ItemRow[4]\`. */
export const ITEM_BERRY = 1
export const ITEM_HAS_SPRITE = 2

/** [slug, índice da categoria, preço, nome em espanhol ('' sem tradução), bits]. */
export type ItemRow = readonly [string, number, number, string, number]

export const ITEMS: readonly ItemRow[] = [
${rows.map((row) => `  ${JSON.stringify(row)},`).join('\n')}
]
`
  )
}

// ---- Naturezas e características ----------------------------------------------------------------

async function natures() {
  const data = await query(`{
    pokemon_v2_stat { id name }
    pokemon_v2_berryflavor { id name }
    pokemon_v2_nature(order_by: { id: asc }) {
      name increased_stat_id decreased_stat_id likes_flavor_id hates_flavor_id
      pokemon_v2_naturenames(where: { language_id: { _eq: ${SPANISH} } }) { name }
    }
    pokemon_v2_characteristic(order_by: { id: asc }) {
      gene_mod_5 stat_id
      pokemon_v2_characteristicdescriptions(where: { language_id: { _in: [${ENGLISH}, ${SPANISH}] } }) {
        description language_id
      }
    }
  }`)
  const stat = new Map(data.pokemon_v2_stat.map((s) => [s.id, s.name]))
  const flavor = new Map(data.pokemon_v2_berryflavor.map((f) => [f.id, f.name]))
  const natureRows = data.pokemon_v2_nature.map((n) => [
    n.name,
    n.pokemon_v2_naturenames[0]?.name ?? '',
    stat.get(n.increased_stat_id) ?? null,
    stat.get(n.decreased_stat_id) ?? null,
    flavor.get(n.likes_flavor_id) ?? null,
    flavor.get(n.hates_flavor_id) ?? null,
  ])
  const characteristicRows = data.pokemon_v2_characteristic.map((c) => {
    const text = (language) =>
      c.pokemon_v2_characteristicdescriptions.find((d) => d.language_id === language)?.description ?? ''
    return [stat.get(c.stat_id), c.gene_mod_5, text(ENGLISH), text(SPANISH)]
  })
  const natureFile =
    header('naturezas') +
    `
/**
 * [slug, nome em espanhol, stat que sobe ×1,1, stat que desce ×0,9, sabor que gosta, sabor que
 * odeia]. Stats e sabores nulos nas 5 naturezas neutras (Hardy, Docile, Serious, Bashful, Quirky).
 */
export type NatureRow = readonly [string, string, string | null, string | null, string | null, string | null]

export const NATURES: readonly NatureRow[] = [
${natureRows.map((row) => `  ${JSON.stringify(row)},`).join('\n')}
]
`
  const characteristicFile =
    header('características') +
    `
/**
 * [stat com o maior IV, resto do IV ÷ 5, texto em inglês, texto em espanhol]. Ex.: "Loves to eat"
 * = o maior IV é o de HP e vale 0, 5, 10, 15, 20, 25 ou 30.
 */
export type CharacteristicRow = readonly [string, number, string, string]

export const CHARACTERISTICS: readonly CharacteristicRow[] = [
${characteristicRows.map((row) => `  ${JSON.stringify(row)},`).join('\n')}
]
`
  return { 'natures.ts': natureFile, 'characteristics.ts': characteristicFile }
}

async function main() {
  const [learnsetFiles, itemFile, natureFiles] = await Promise.all([learnsets(), items(), natures()])
  const files = {
    ...Object.fromEntries(Object.entries(learnsetFiles).map(([name, body]) => [`learnsets/${name}`, body])),
    'items.ts': itemFile,
    ...natureFiles,
  }

  if (process.argv.includes('--check')) {
    let differ = false
    for (const [name, body] of Object.entries(files)) {
      const current = await readFile(`${OUT_DIR}${name}`, 'utf8').catch(() => null)
      if (current !== body) {
        console.log(`${name}: ${current === null ? 'novo' : 'mudou'}`)
        differ = true
      }
    }
    const existing = await readdir(LEARNSET_DIR).catch(() => [])
    for (const name of existing.filter((n) => !files[`learnsets/${n}`])) {
      console.log(`learnsets/${name}: sobrando`)
      differ = true
    }
    if (!differ) console.log('Dados de referência já estão iguais aos gerados.')
    process.exitCode = differ ? 1 : 0
    return
  }

  await mkdir(LEARNSET_DIR, { recursive: true })
  for (const [name, body] of Object.entries(files)) await writeFile(`${OUT_DIR}${name}`, body)
  console.log(`${Object.keys(files).length} arquivos em src/data/generated/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
