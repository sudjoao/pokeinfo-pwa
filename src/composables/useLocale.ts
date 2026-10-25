import { computed } from 'vue'
import { i18n, loadLocaleMessages, LOCALES, LOCALE_KEY, type Locale } from '@/plugins/i18n'
import { loadVuetifyMessages, vuetify } from '@/plugins/vuetify'
import { writeStorage } from '@/utils/storage'

/** Locale do Vuetify (textos internos dos componentes, ex.: "limpar" do campo de busca). */
const VUETIFY_LOCALE: Record<Locale, string> = { 'pt-BR': 'pt', en: 'en', es: 'es' }

/** Baixa as mensagens do app e as do Vuetify no idioma; precisa terminar antes de aplicá-lo. */
export function loadLocale(locale: Locale): Promise<void> {
  return Promise.all([
    loadLocaleMessages(locale),
    loadVuetifyMessages(VUETIFY_LOCALE[locale]),
  ]).then(() => {})
}

function apply(locale: Locale): void {
  vuetify.locale.current.value = VUETIFY_LOCALE[locale]
  document.documentElement.lang = locale
}

/** Idioma da interface: persistido no aparelho e aplicado ao vue-i18n, ao Vuetify e ao `<html lang>`. */
export function useLocale() {
  const locale = computed(() => i18n.global.locale.value)

  async function setLocale(next: Locale): Promise<void> {
    if (next === i18n.global.locale.value) return
    writeStorage(LOCALE_KEY, next)
    await loadLocale(next)
    i18n.global.locale.value = next
    apply(next)
  }

  return { locale, locales: LOCALES, setLocale }
}

/** Sincroniza Vuetify e `<html lang>` com o idioma inicial; chamado uma vez no boot. */
export function applyInitialLocale(): void {
  apply(i18n.global.locale.value)
}
