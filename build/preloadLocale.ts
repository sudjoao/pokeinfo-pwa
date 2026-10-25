import type { Plugin } from 'vite'

/** Mensagens internas do Vuetify por idioma do app (o inglês já vem embutido nele). */
const VUETIFY_LOCALES: Record<string, RegExp> = {
  'pt-BR': /\/vuetify\/lib\/locale\/pt\.js$/,
  es: /\/vuetify\/lib\/locale\/es\.js$/,
}

/**
 * As mensagens do idioma são um chunk à parte, e o app só monta com elas (main.ts). Sem ajuda, o
 * navegador só descobre esse chunk depois de baixar e rodar o JS principal: mais uma ida e volta
 * na rede antes da primeira pintura. Este script inline escolhe o idioma como `initialLocale()`
 * (src/plugins/i18n.ts) e pede o chunk já, em paralelo com o JS principal. Se as duas regras
 * divergirem, o pior caso é baixar um idioma à toa.
 */
export function preloadLocale(): Plugin {
  let base = '/'
  /** Id do módulo de cada idioma: o plugin do vue-i18n troca os JSON por módulos virtuais. */
  const appLocaleIds = new Map<string, string>()
  return {
    name: 'pokeinfo:preload-locale',
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      base = config.base
    },
    async resolveId(source, importer, options) {
      const locale = source.match(/\/src\/locales\/([\w-]+)\.json$/)?.[1]
      if (!locale) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (resolved) appLocaleIds.set(resolved.id, locale)
      return resolved
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return
        const files: Record<string, string[]> = { 'pt-BR': [], en: [], es: [] }
        for (const file of Object.values(ctx.bundle)) {
          if (file.type !== 'chunk') continue
          for (const id of file.moduleIds) {
            const locale =
              appLocaleIds.get(id) ??
              Object.keys(VUETIFY_LOCALES).find((key) => VUETIFY_LOCALES[key]!.test(id))
            if (locale) files[locale]?.push(base + file.fileName)
          }
        }
        if (Object.values(files).some((list) => list.length === 0)) {
          throw new Error(`preloadLocale: chunk de idioma não encontrado ${JSON.stringify(files)}`)
        }
        const script = `(function () {
  var files = ${JSON.stringify(files)}
  var locale
  try {
    locale = JSON.parse(localStorage.getItem('pokeinfo:locale:v1'))
  } catch (e) {}
  if (!Object.prototype.hasOwnProperty.call(files, locale)) {
    var device = (navigator.language || '').toLowerCase()
    locale = device.indexOf('pt') === 0 ? 'pt-BR' : device.indexOf('es') === 0 ? 'es' : 'en'
  }
  files[locale].forEach(function (href) {
    var link = document.createElement('link')
    link.rel = 'modulepreload'
    link.crossOrigin = ''
    link.href = href
    document.head.appendChild(link)
  })
})()`
        return [{ tag: 'script', children: script, injectTo: 'head' }]
      },
    },
  }
}
