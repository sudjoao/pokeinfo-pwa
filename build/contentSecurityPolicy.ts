import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

/**
 * Origens externas que o app usa. Tudo o que não está aqui é bloqueado pelo navegador: um script
 * injetado (XSS) não consegue carregar código de fora nem mandar a sessão da conta para outro site.
 */
const SOURCES = {
  // PokéAPI (JSON), GitHub (gritos) e wsrv.nl e GitHub também por fetch nos pacotes do "Usar
  // offline" (src/composables/useOfflinePacks.ts), que baixam artwork e gritos de uma vez.
  connect: ['https://pokeapi.co', 'https://wsrv.nl', 'https://raw.githubusercontent.com'],
  // Foto da conta Google vem de lh3..lh6.googleusercontent.com.
  img: ['https://wsrv.nl', 'https://raw.githubusercontent.com', 'https://*.googleusercontent.com'],
  media: ['https://raw.githubusercontent.com'],
}

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g

function sha256(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`
}

/** A política, com os hashes dos scripts inline do index.html e a origem do Supabase do build. */
export function buildPolicy(html: string, supabaseUrl?: string): string {
  const hashes = [...html.matchAll(INLINE_SCRIPT)].map((match) => sha256(match[1]!))
  const supabase = supabaseUrl ? [new URL(supabaseUrl).origin] : []
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...hashes],
    // O Vuetify grava as cores do tema numa <style> criada em runtime, e os componentes usam
    // atributos style: sem nonce (o site é estático), só com 'unsafe-inline'. CSS não executa código.
    'style-src': ["'self'", "'unsafe-inline'"],
    // data: nos SVG embutidos no CSS; blob: na imagem de compartilhar.
    'img-src': ["'self'", 'data:', 'blob:', ...SOURCES.img],
    // blob: nos gritos já baixados; data: no WAV silencioso que libera o áudio no iOS (useCry.ts).
    'media-src': ["'self'", 'data:', 'blob:', ...SOURCES.media],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...SOURCES.connect, ...supabase],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}

/**
 * Content Security Policy num <meta> do index.html, gerada no build. Na Vercel o site é estático
 * (sem nonce por requisição), então o script inline do `preloadLocale` entra pelo hash, calculado
 * aqui a partir do HTML final (o plugin roda por último, para ver todos os scripts inline).
 * `frame-ancestors`, que não funciona em <meta>, vai no cabeçalho do vercel.json.
 * Só no build: o servidor de desenvolvimento do Vite injeta scripts e usa WebSocket.
 */
export function contentSecurityPolicy(): Plugin {
  let supabaseUrl: string | undefined
  return {
    name: 'pokeinfo:content-security-policy',
    apply: 'build',
    // Depois dos plugins do próprio Vite: o generateBundle abaixo precisa do index.html já emitido.
    enforce: 'post',
    configResolved(config) {
      // Mesma variável que src/services/cloud/client.ts lê (do .env.local ou da Vercel).
      supabaseUrl = config.env.VITE_SUPABASE_URL || undefined
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Logo depois do <meta charset> (que precisa estar nos primeiros 1024 bytes) e antes de
        // qualquer script: a política só vale para o que vem depois dela no documento.
        const policy = buildPolicy(html, supabaseUrl).replaceAll('"', '&quot;')
        const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`
        const charset = /<meta charset="[^"]*"\s*\/?>/i
        if (!charset.test(html))
          throw new Error('contentSecurityPolicy: <meta charset> não encontrado')
        return html.replace(charset, (tag) => `${tag}\n    ${meta}`)
      },
    },
    // Confere o index.html que vai para o dist: se outro plugin mexer num script inline depois
    // daqui, o hash não bate e o app não abriria em produção. Melhor quebrar o build.
    generateBundle(_options, bundle) {
      const asset = bundle['index.html']
      if (asset?.type !== 'asset') return
      const html = String(asset.source)
      const current = html.match(
        /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/,
      )?.[1]
      const expected = buildPolicy(html, supabaseUrl).replaceAll('"', '&quot;')
      if (current !== expected) {
        throw new Error(`contentSecurityPolicy: política desatualizada no index.html\n${current}`)
      }
    },
  }
}
