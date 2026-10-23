import { ref } from 'vue'
import { vuetify } from '@/plugins/vuetify'
import { readStorage, writeStorage } from '@/utils/storage'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

const THEME_KEY = 'pokeinfo:theme:v1'

function isPreference(value: unknown): value is ThemePreference {
  return (THEME_PREFERENCES as readonly unknown[]).includes(value)
}

const preference = ref<ThemePreference>(
  ((saved) => (isPreference(saved) ? saved : 'system'))(readStorage<string>(THEME_KEY)),
)

/** Tema escolhido pelo usuário (padrão: o do sistema), salvo no aparelho. */
export function useThemePreference() {
  function setPreference(next: ThemePreference): void {
    preference.value = next
    writeStorage(THEME_KEY, next)
    vuetify.theme.change(next)
  }

  return { preference, setPreference }
}

/** Aplica o tema salvo; chamado uma vez no boot, antes de montar o app. */
export function applyInitialTheme(): void {
  vuetify.theme.change(preference.value)
}
