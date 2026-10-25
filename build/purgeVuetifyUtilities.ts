import { globSync, readFileSync } from 'node:fs'
import postcss from 'postcss'
import type { Plugin } from 'vite'

/** Onde as classes usadas podem aparecer: o app e os componentes do Vuetify. */
const SOURCES = [
  'index.html',
  'src/**/*.{vue,ts}',
  'node_modules/vuetify/lib/{components,composables,directives,util}/**/*.js',
]

/**
 * Classes que o Vuetify monta a partir de props (`elevation="2"` vira `elevation-2`,
 * `color="amber"` vira `bg-amber`/`text-amber`, `rounded="lg"` vira `rounded-lg`…). O nome inteiro
 * nunca aparece no código, só o valor da prop: para elas basta o sufixo aparecer.
 */
const PROP_PREFIXES = [
  'elevation-',
  'hover-elevation-',
  'rounded-',
  'border-',
  'bg-',
  'text-',
  'order-',
  'align-self-',
  'align-content-',
  'justify-',
]

/**
 * Tira do `vuetify/styles` as classes utilitárias que o app não usa. Ele traz ~240 KB de
 * utilitários (margens, flex, cores e tipografia em todos os breakpoints) que bloqueiam a primeira
 * pintura; o app usa poucas dezenas.
 *
 * Uma classe fica se o nome aparece como palavra no código do app ou dos componentes do Vuetify
 * (um superconjunto: comentários e textos também contam) ou, para as de `PROP_PREFIXES`, se o
 * sufixo aparece. Só mexe nas camadas `vuetify-utilities*`; classes `v-*` (estado dos componentes,
 * ex.: `.v-locale--is-rtl .ms-2`) contam como usadas. Roda na transformação do arquivo, antes do
 * hash: um uso novo de classe muda o conteúdo e, com ele, o nome do CSS (que tem cache imutável).
 */
export function purgeVuetifyUtilities(): Plugin {
  let tokens = new Set<string>()

  const used = (name: string): boolean =>
    name.startsWith('v-') ||
    tokens.has(name) ||
    PROP_PREFIXES.some((prefix) => name.startsWith(prefix) && tokens.has(name.slice(prefix.length)))

  return {
    name: 'pokeinfo:purge-vuetify-utilities',
    apply: 'build',
    enforce: 'pre',
    buildStart() {
      tokens = new Set()
      for (const file of globSync(SOURCES)) {
        for (const token of readFileSync(file, 'utf8').match(/[\w-]+/g) ?? []) tokens.add(token)
      }
    },
    transform(code, id) {
      if (!id.endsWith('/vuetify/lib/styles/main.css')) return
      const root = postcss.parse(code)
      root.walkAtRules('layer', (layer) => {
        if (!layer.params.startsWith('vuetify-utilities')) return
        layer.walkRules((rule) => {
          const kept = rule.selectors.filter((selector) =>
            [...selector.matchAll(/\.((?:\\.|[\w-])+)/g)].every(([, name]) =>
              used(name!.replace(/\\/g, '')),
            ),
          )
          if (kept.length === rule.selectors.length) return
          if (kept.length) rule.selectors = kept
          else rule.remove()
        })
      })
      // Media queries e camadas que ficaram vazias, de dentro para fora.
      const atRules: postcss.AtRule[] = []
      root.walkAtRules((atRule) => void atRules.push(atRule))
      for (const atRule of atRules.reverse()) {
        if (atRule.nodes?.length === 0) atRule.remove()
      }
      return { code: root.toString(), map: null }
    },
  }
}
