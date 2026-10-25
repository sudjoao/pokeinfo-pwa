#!/usr/bin/env node
/**
 * Imprime as notas de uma versão do CHANGELOG.md, no formato do corpo de uma release do GitHub.
 *
 * O CHANGELOG quebra as linhas em ~100 colunas; a release do GitHub mostra cada quebra como uma
 * linha nova, então as continuações de parágrafo e de item de lista voltam a ser uma linha só. No
 * fim vai o link de comparação com a versão anterior (o da lista de links do CHANGELOG).
 *
 * Uso: node scripts/release-notes.mjs 1.7.1  (Node 22+, sem dependências)
 * Usado pelo .github/workflows/release.yml; sai com erro se a versão não estiver no CHANGELOG.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CHANGELOG = fileURLToPath(new URL('../CHANGELOG.md', import.meta.url))
const version = process.argv[2]?.replace(/^v/, '')
if (!version) {
  console.error('Uso: node scripts/release-notes.mjs <versão>')
  process.exit(1)
}

const lines = readFileSync(CHANGELOG, 'utf8').split('\n')
const escaped = version.replaceAll('.', '\\.')
const start = lines.findIndex((line) => new RegExp(`^## \\[${escaped}\\]`).test(line))
if (start === -1) {
  console.error(`Versão ${version} não encontrada em CHANGELOG.md`)
  process.exit(1)
}
const end = lines.findIndex((line, index) => index > start && /^(## |\[[^\]]+\]: )/.test(line))
const section = lines.slice(start + 1, end === -1 ? undefined : end)

/** Junta as continuações: linha com texto que não abre item, título, tabela nem bloco de código. */
const out = []
let inCode = false
for (const line of section) {
  const text = line.trim()
  if (text.startsWith('```')) inCode = !inCode
  const previous = out.at(-1)
  const opensBlock = text === '' || /^(#|[-*+] |\d+\. |\||>|```)/.test(text)
  if (!inCode && !opensBlock && previous && previous.trim() !== '' && !previous.startsWith('#')) {
    out[out.length - 1] = `${previous} ${text}`
  } else {
    out.push(line.trimEnd())
  }
}

const notes = out.join('\n').trim()
const compare = lines.find((line) => line.startsWith(`[${version}]: `))?.slice(version.length + 4)
console.log(compare?.includes('/compare/') ? `${notes}\n\n**Comparação:** ${compare}` : notes)
