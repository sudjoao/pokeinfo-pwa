#!/usr/bin/env node
/**
 * Gera src/data/generated/megas.ts: as Mega Evoluções (id do Pokémon, ex.: 10034 =
 * charizard-mega-x) agrupadas pelo grupo de versões em que estrearam, a partir de `/pokemon-form`
 * (`is_mega` e `version_group`). É o que diz em quais jogos cada mega existe
 * (src/utils/megas.ts); a espécie de cada uma já está em forms.ts.
 *
 * Uso: node scripts/gen-megas.mjs [--check]  (Node 22+, sem dependências, ~100 requisições)
 * Rodar de novo quando a PokéAPI ganhar megas novas (jogo ou DLC).
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const REST = 'https://pokeapi.co/api/v2'
const OUT = fileURLToPath(new URL('../src/data/generated/megas.ts', import.meta.url))
const CHECK = process.argv.includes('--check')
const PARALLEL = 8

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
  // O nome só reduz as requisições (toda mega tem "-mega" no slug); quem decide é o `is_mega`.
  const list = await rest('pokemon-form?limit=100000&offset=0')
  const candidates = list.results.filter((resource) => /-mega(-|$)/.test(resource.name))

  const megas = []
  const queue = [...candidates]
  await Promise.all(
    Array.from({ length: PARALLEL }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const form = await rest(`pokemon-form/${idOf(next.url)}`)
        if (!form.is_mega) continue
        megas.push({ id: idOf(form.pokemon.url), debut: form.version_group.name })
      }
    }),
  )
  if (megas.length < 48) throw new Error(`Megas de menos (${megas.length}): a API mudou?`)

  // Grupos na ordem de lançamento (a do `/version-group`), ids em ordem crescente.
  const order = (await rest('version-group?limit=1000')).results.map((group) => group.name)
  const byDebut = new Map()
  for (const { id, debut } of megas.sort((a, b) => a.id - b.id)) {
    if (!byDebut.has(debut)) byDebut.set(debut, [])
    byDebut.get(debut).push(id)
  }
  const groups = [...byDebut.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))

  const content =
    '// Gerado por scripts/gen-megas.mjs a partir da PokéAPI (/pokemon-form: is_mega e version_group). Não editar à mão.\n\n' +
    '/** Megas (id do Pokémon, ex.: 10034 = charizard-mega-x) pelo grupo de versões em que estrearam. */\n' +
    'export const MEGA_DEBUTS: Readonly<Record<string, readonly number[]>> = {\n' +
    groups.map((group) => `  '${group}': [${byDebut.get(group).join(',')}],\n`).join('') +
    '}\n'

  if (CHECK) {
    const current = await readFile(OUT, 'utf8').catch(() => '')
    if (current === content) {
      console.log(`megas.ts em dia (${megas.length} megas)`)
      return
    }
    console.error('megas.ts está diferente do que a PokéAPI tem hoje; rode sem --check.')
    process.exitCode = 1
    return
  }

  await writeFile(OUT, content)
  console.log(`megas.ts: ${megas.length} megas em ${groups.length} grupos (${groups.join(', ')})`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
