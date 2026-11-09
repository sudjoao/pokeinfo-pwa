import * as mdi from '@mdi/js'
import type { Plugin } from 'vite'

const VIRTUAL = 'virtual:mdi-icon/'
const RESOLVED = '\0mdi-icon:'

/** `import { mdiA, mdiB as b } from '@mdi/js'`, em uma ou várias linhas. */
const IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"]@mdi\/js['"];?/g

/**
 * O `@mdi/js` é um módulo só: o empacotador não consegue dividi-lo, então todos os ícones usados
 * no app (~100, do menu, do detalhe, das sheets) iam para o chunk que a Home carrega na abertura.
 * Aqui cada ícone importado vira um módulo próprio (`export default "<path>"`) e fica no chunk de
 * quem o usa.
 *
 * Só no build: no dev o chunking não importa. Roda antes do plugin do Vue, sobre o texto do
 * arquivo; o vue-tsc continua vendo o import original.
 */
export function splitMdiIcons(): Plugin {
  const icons = mdi as Record<string, string>
  return {
    name: 'pokeinfo:split-mdi-icons',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/node_modules/') || !/\.(vue|ts)$/.test(id) || !code.includes('@mdi/js')) {
        return null
      }
      const result = code.replace(IMPORT, (statement, list: string) => {
        const imports = list
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const [name, local = name] = part.split(/\s+as\s+/).map((item) => item.trim())
            if (!name || icons[name] === undefined) {
              this.error(`splitMdiIcons: ícone "${name}" não existe no @mdi/js (${id})`)
            }
            return `import ${local} from '${VIRTUAL}${name}';`
          })
        // Tudo numa linha, com as quebras do original no fim: as linhas seguintes não mudam de lugar.
        return imports.join(' ') + '\n'.repeat(statement.split('\n').length - 1)
      })
      if (/from\s*['"]@mdi\/js['"]/.test(result)) {
        this.error(`splitMdiIcons: import do @mdi/js em formato não suportado (${id})`)
      }
      return { code: result, map: null }
    },
    resolveId(source) {
      return source.startsWith(VIRTUAL) ? RESOLVED + source.slice(VIRTUAL.length) : null
    },
    load(id) {
      if (!id.startsWith(RESOLVED)) return null
      return `export default ${JSON.stringify(icons[id.slice(RESOLVED.length)])}`
    },
  }
}
