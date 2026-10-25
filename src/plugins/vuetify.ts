import 'vuetify/styles'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

const light: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#dc2626',
    secondary: '#3b4cca',
    background: '#f6f6f8',
    surface: '#ffffff',
  },
  variables: {
    // Texto secundário (subtítulos, legendas): o padrão de 0.6 do Vuetify dá ~4,2:1 sobre o
    // fundo cinza claro, abaixo dos 4,5:1 do WCAG AA. 0.7 é o mesmo que o tema escuro já usa.
    'medium-emphasis-opacity': 0.7,
  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#ef4444',
    secondary: '#8b9cff',
    // O Vuetify escolhe texto branco sobre esse azul claro (2,5:1); o escuro passa de 7:1.
    'on-secondary': '#0b1546',
    background: '#121212',
    surface: '#1e1e1e',
  },
}

export const vuetify = createVuetify({
  // Textos internos dos componentes; o idioma atual é trocado por `useLocale`. O inglês já vem
  // embutido no Vuetify; pt e es chegam por `loadVuetifyMessages`, junto com as mensagens do app.
  locale: {
    locale: 'en',
    fallback: 'en',
  },
  theme: {
    defaultTheme: 'system',
    themes: { light, dark },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VCard: { rounded: 'lg', elevation: 1 },
    VChip: { size: 'small', label: true },
    VTextField: { variant: 'solo-filled', flat: true, rounded: 'pill', density: 'comfortable' },
  },
})

/** Mensagens do Vuetify que não vêm embutidas, um chunk por idioma (~4 KB cada). */
const messageLoaders: Record<string, () => Promise<typeof import('vuetify/lib/locale/pt.js')>> = {
  pt: () => import('vuetify/lib/locale/pt.js'),
  es: () => import('vuetify/lib/locale/es.js'),
}

/** Baixa as mensagens do Vuetify no idioma (uma vez só). Precisa terminar antes de trocar `current`. */
export async function loadVuetifyMessages(code: string): Promise<void> {
  const messages = vuetify.locale.messages.value
  const loader = messageLoaders[code]
  if (!loader || messages[code]) return
  messages[code] = (await loader()).default
}
