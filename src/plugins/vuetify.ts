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
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#ef4444',
    secondary: '#8b9cff',
    background: '#121212',
    surface: '#1e1e1e',
  },
}

export const vuetify = createVuetify({
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
