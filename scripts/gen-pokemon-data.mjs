#!/usr/bin/env node
/**
 * Gera as tabelas estáticas de src/data/generated/ a partir da API GraphQL (beta) da PokéAPI.
 *
 * O app nunca chama o GraphQL em tempo de execução (é beta); ele só é usado aqui, uma vez, para
 * montar dados que custariam centenas de requisições REST:
 *   - pokemon.ts:   stats base, altura, peso, geração, lendário/mítico/bebê e habilidades de cada
 *                   Pokémon/forma (filtros, ordenação e comparação sem baixar /pokemon/{id}).
 *   - moves.ts:     tipo, categoria, poder, precisão e PP de cada golpe, com os valores antigos
 *                   por grupo de versões (ex.: Karate Chop era Normal na 1ª geração).
 *   - typesPast.ts: exceções da tabela de tipos em gerações antigas e tipos antigos de Pokémon
 *                   (ex.: Clefairy era Normal até a 5ª geração).
 *
 * Uso: node scripts/gen-pokemon-data.mjs  (Node 22+, sem dependências)
 * Rodar de novo quando a PokéAPI ganhar um jogo/geração nova.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta'
const REST = 'https://pokeapi.co/api/v2'
const OUT_DIR = fileURLToPath(new URL('../src/data/generated/', import.meta.url))
const SPANISH = 7

/** Mesma ordem de POKEMON_TYPES (src/types/pokemon.ts): o índice é o que vai nos arquivos. */
const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'stellar', 'unknown',
]
const STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

async function query(gql) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: gql }),
    })
    const json = await response.json().catch(() => null)
    if (response.ok && json?.data) return json.data
    if (attempt >= 3) throw new Error(`GraphQL falhou: ${response.status} ${JSON.stringify(json?.errors ?? json)}`)
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
}

async function rest(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${REST}/${path}`)
    if (response.ok) return response.json()
    if (attempt >= 3) throw new Error(`REST falhou: ${path} ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
  }
}

const idOf = (url) => Number(url.replace(/\/$/, '').split('/').pop())

/**
 * O GraphQL beta fica atrás do REST (faltavam ~50 formas novas, como as Megas de Legends: Z-A).
 * O que não vier por ele é completado pelo REST, no mesmo formato da consulta GraphQL.
 */
async function missingPokemonFromRest(knownIds) {
  const index = await rest('pokemon?limit=100000')
  const missing = index.results.map((r) => idOf(r.url)).filter((id) => !knownIds.has(id))
  const result = []
  for (const id of missing) {
    const p = await rest(`pokemon/${id}`)
    const species = await rest(`pokemon-species/${idOf(p.species.url)}`)
    result.push({
      id,
      height: p.height,
      weight: p.weight,
      pokemon_v2_pokemonstats: p.stats.map((s) => ({ base_stat: s.base_stat, pokemon_v2_stat: { name: s.stat.name } })),
      pokemon_v2_pokemonabilities: p.abilities.map((a) => ({ is_hidden: a.is_hidden, slot: a.slot, pokemon_v2_ability: { name: a.ability.name } })),
      pokemon_v2_pokemonspecy: {
        is_legendary: species.is_legendary,
        is_mythical: species.is_mythical,
        is_baby: species.is_baby,
        generation_id: idOf(species.generation.url),
      },
    })
  }
  return result
}

async function missingMovesFromRest(knownNames, typeIdByName) {
  const index = await rest('move?limit=100000')
  const result = []
  for (const { name } of index.results.filter((r) => !knownNames.has(r.name))) {
    const m = await rest(`move/${name}`)
    result.push({
      name,
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      type_id: typeIdByName.get(m.type.name),
      move_damage_class_id: { status: 1, physical: 2, special: 3 }[m.damage_class?.name] ?? 1,
      pokemon_v2_movenames: m.names.filter((n) => n.language.name === 'es').map((n) => ({ name: n.name })),
      pokemon_v2_movechanges: [],
    })
  }
  return result
}

const header = (what) =>
  `// Gerado por scripts/gen-pokemon-data.mjs a partir da PokéAPI (${what}). Não editar à mão.\n`

async function main() {
  const base = await query(`{
    pokemon_v2_type { id name }
    pokemon_v2_ability(order_by: { name: asc }) {
      id name pokemon_v2_abilitynames(where: { language_id: { _eq: ${SPANISH} } }) { name }
    }
  }`)
  const typeName = new Map(base.pokemon_v2_type.map((t) => [t.id, t.name]))
  const typeIdByName = new Map(base.pokemon_v2_type.map((t) => [t.name, t.id]))
  /** -1 para tipos fora de batalha na série principal (ex.: "shadow", de Colosseum). */
  const typeIndex = (id) => POKEMON_TYPES.indexOf(typeName.get(id))
  // Grupos de versões pelo REST: o GraphQL usa outros slugs em alguns (BDSP) e não tem os mais
  // novos (Legends: Z-A, Champions). Os ids são os mesmos nos dois.
  const vgIndex = await rest('version-group?limit=100')
  const versionGroups = []
  for (const { url } of vgIndex.results) {
    const vg = await rest(`version-group/${idOf(url)}`)
    versionGroups.push({ id: vg.id, name: vg.name, order: vg.order, generation_id: idOf(vg.generation.url) })
  }
  versionGroups.sort((a, b) => a.order - b.order)
  const vgOrder = new Map(versionGroups.map((vg) => [vg.id, vg.order]))

  // ---- Pokémon ------------------------------------------------------------------------------
  const abilityIds = new Map()
  const abilities = []
  const pokemon = []
  for (let offset = 0; ; offset += 500) {
    const page = await query(`{
      pokemon_v2_pokemon(order_by: { id: asc }, limit: 500, offset: ${offset}) {
        id height weight
        pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
        pokemon_v2_pokemonabilities(order_by: { slot: asc }) { is_hidden slot pokemon_v2_ability { name } }
        pokemon_v2_pokemonspecy { is_legendary is_mythical is_baby generation_id }
      }
    }`)
    pokemon.push(...page.pokemon_v2_pokemon)
    if (page.pokemon_v2_pokemon.length < 500) break
  }
  const fromRest = await missingPokemonFromRest(new Set(pokemon.map((p) => p.id)))
  pokemon.push(...fromRest)
  pokemon.sort((a, b) => a.id - b.id)
  console.log(`  ${fromRest.length} Pokémon completados pelo REST`)
  const esAbility = new Map(
    base.pokemon_v2_ability.map((a) => [a.name, a.pokemon_v2_abilitynames[0]?.name ?? '']),
  )
  const abilityIndex = (name) => {
    if (!abilityIds.has(name)) {
      abilityIds.set(name, abilities.length)
      abilities.push([name, esAbility.get(name) ?? ''])
    }
    return abilityIds.get(name)
  }
  // Ordena as habilidades por nome para o índice ser estável entre execuções.
  for (const name of [...new Set(pokemon.flatMap((p) => p.pokemon_v2_pokemonabilities.map((a) => a.pokemon_v2_ability.name)))].sort()) {
    abilityIndex(name)
  }

  const rows = pokemon.map((p) => {
    const stats = STATS.map((stat) => p.pokemon_v2_pokemonstats.find((s) => s.pokemon_v2_stat.name === stat)?.base_stat ?? 0)
    const species = p.pokemon_v2_pokemonspecy
    const flags = (species.is_legendary ? 1 : 0) | (species.is_mythical ? 2 : 0) | (species.is_baby ? 4 : 0)
    const regular = p.pokemon_v2_pokemonabilities.filter((a) => !a.is_hidden).map((a) => abilityIndex(a.pokemon_v2_ability.name))
    const hidden = p.pokemon_v2_pokemonabilities.find((a) => a.is_hidden)
    return `${p.id}:[${stats.join(',')},${p.height},${p.weight},${species.generation_id},${flags},[${regular.join(',')}],${hidden ? abilityIndex(hidden.pokemon_v2_ability.name) : -1}]`
  })

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(
    `${OUT_DIR}pokemon.ts`,
    `${header('pokemon, pokemonstats, pokemonabilities, pokemonspecies')}
/**
 * [hp, atk, def, spa, spd, spe, altura (dm), peso (hg), geração, flags, habilidades, oculta]
 * flags: 1 = lendário, 2 = mítico, 4 = bebê. Habilidades são índices em ABILITIES; oculta -1 = nenhuma.
 */
export type PokemonDataRow = readonly [
  number, number, number, number, number, number,
  number, number, number, number, readonly number[], number,
]

/** [slug, nome em espanhol] (os outros idiomas usam o slug formatado, como o resto do app). */
export const ABILITIES: readonly (readonly [string, string])[] = ${JSON.stringify(abilities)}

export const POKEMON_DATA: Readonly<Record<number, PokemonDataRow>> = {${rows.join(',')}}
`,
  )
  console.log(`pokemon.ts: ${rows.length} Pokémon, ${abilities.length} habilidades`)

  // ---- Golpes -------------------------------------------------------------------------------
  const moves = (
    await query(`{
      pokemon_v2_move(order_by: { name: asc }) {
        name power accuracy pp type_id move_damage_class_id
        pokemon_v2_movenames(where: { language_id: { _eq: ${SPANISH} } }) { name }
        pokemon_v2_movechanges { power accuracy pp type_id version_group_id }
      }
    }`)
  ).pokemon_v2_move
  const restMoves = await missingMovesFromRest(new Set(moves.map((m) => m.name)), typeIdByName)
  moves.push(...restMoves)
  moves.sort((a, b) => a.name.localeCompare(b.name))
  console.log(`  ${restMoves.length} golpes completados pelo REST`)
  const battleMoves = moves.filter((m) => typeIndex(m.type_id) >= 0)
  // move_damage_class_id: 1 status, 2 physical, 3 special -> 0, 1, 2
  const moveRows = battleMoves.map((m) => {
    const row = [typeIndex(m.type_id), (m.move_damage_class_id ?? 1) - 1, m.power ?? 0, m.accuracy ?? 0, m.pp ?? 0, m.pokemon_v2_movenames[0]?.name ?? '']
    return `${JSON.stringify(m.name)}:${JSON.stringify(row)}`
  })
  const changeRows = battleMoves
    .filter((m) => m.pokemon_v2_movechanges.length)
    .map((m) => {
      const changes = m.pokemon_v2_movechanges
        .map((c) => [vgOrder.get(c.version_group_id), c.power, c.accuracy, c.pp, c.type_id == null || typeIndex(c.type_id) < 0 ? null : typeIndex(c.type_id)])
        .sort((a, b) => a[0] - b[0])
      return `${JSON.stringify(m.name)}:${JSON.stringify(changes)}`
    })
  const vgRows = versionGroups.map((vg) => `${JSON.stringify(vg.name)}:[${vg.order},${vg.generation_id}]`)
  await writeFile(
    `${OUT_DIR}moves.ts`,
    `${header('move, movenames, movechanges, versiongroup')}
/** [tipo (índice em POKEMON_TYPES), categoria (0 status, 1 físico, 2 especial), poder, precisão, PP, nome em espanhol]; 0 = sem valor. */
export type MoveRow = readonly [number, number, number, number, number, string]

/**
 * Valores antigos: [ordem do grupo de versões, poder, precisão, PP, tipo]. Valem para os grupos de
 * versões ANTERIORES a essa ordem (é o grupo em que o golpe mudou); null = campo não mudou.
 */
export type MoveChange = readonly [number, number | null, number | null, number | null, number | null]

/** Grupo de versões -> [ordem cronológica, geração]. */
export const VERSION_GROUPS: Readonly<Record<string, readonly [number, number]>> = {${vgRows.join(',')}}

export const MOVES: Readonly<Record<string, MoveRow>> = {${moveRows.join(',')}}

export const MOVE_CHANGES: Readonly<Record<string, readonly MoveChange[]>> = {${changeRows.join(',')}}
`,
  )
  console.log(`moves.ts: ${moveRows.length} golpes, ${changeRows.length} com valores antigos`)

  // ---- Tabela de tipos e tipos antigos ------------------------------------------------------
  const past = await query(`{
    pokemon_v2_typeefficacypast { damage_factor generation_id damage_type_id target_type_id }
    pokemon_v2_pokemontypepast(order_by: [{ pokemon_id: asc }, { slot: asc }]) { pokemon_id generation_id slot type_id }
  }`)
  const efficacy = past.pokemon_v2_typeefficacypast.map(
    (e) => [e.generation_id, POKEMON_TYPES[typeIndex(e.damage_type_id)], POKEMON_TYPES[typeIndex(e.target_type_id)], e.damage_factor / 100],
  )
  const pastTypes = new Map()
  for (const row of past.pokemon_v2_pokemontypepast) {
    const key = `${row.pokemon_id}:${row.generation_id}`
    if (!pastTypes.has(key)) pastTypes.set(key, { id: row.pokemon_id, gen: row.generation_id, types: [] })
    pastTypes.get(key).types.push(POKEMON_TYPES[typeIndex(row.type_id)])
  }
  const pastByPokemon = new Map()
  for (const entry of pastTypes.values()) {
    if (!pastByPokemon.has(entry.id)) pastByPokemon.set(entry.id, [])
    pastByPokemon.get(entry.id).push([entry.gen, entry.types])
  }
  const pastRows = [...pastByPokemon].map(([id, list]) => `${id}:${JSON.stringify(list.sort((a, b) => a[0] - b[0]))}`)
  await writeFile(
    `${OUT_DIR}typesPast.ts`,
    `${header('typeefficacypast, pokemontypepast')}
import type { PokemonType } from '@/types/pokemon'

/** [última geração em que valia, atacante, defensor, multiplicador] */
export const TYPE_CHART_PAST: readonly (readonly [number, PokemonType, PokemonType, number])[] = ${JSON.stringify(efficacy)}

/** Pokémon -> [[última geração em que valia, tipos]] (ex.: Clefairy era Normal até a 5ª). */
export const PAST_TYPES: Readonly<Record<number, readonly (readonly [number, readonly PokemonType[]])[]>> = {${pastRows.join(',')}}
`,
  )
  console.log(`typesPast.ts: ${efficacy.length} exceções de efetividade, ${pastRows.length} Pokémon com tipos antigos`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
