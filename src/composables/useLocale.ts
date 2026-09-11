import { computed } from 'vue'
import { i18n, LOCALES, LOCALE_KEY, type Locale } from '@/plugins/i18n'
import { vuetify } from '@/plugins/vuetify'
import { writeStorage } from '@/utils/storage'

/** Locale do Vuetify (textos internos dos componentes, ex.: "limpar" do campo de busca). */
const VUETIFY_LOCALE: Record<Locale, string> = { 'pt-BR': 'pt', en: 'en', es: 'es' }

function apply(locale: Locale): void {
  vuetify.locale.current.value = VUETIFY_LOCALE[locale]
  document.documentElement.lang = locale
}

/** Idioma da interface: persistido no aparelho e aplicado ao vue-i18n, ao Vuetify e ao `<html lang>`. */
export function useLocale() {
  const locale = computed(() => i18n.global.locale.value)

  function setLocale(next: Locale): void {
    if (next === i18n.global.locale.value) return
    i18n.global.locale.value = next
    writeStorage(LOCALE_KEY, next)
    apply(next)
  }

  return { locale, locales: LOCALES, setLocale }
}

/** Sincroniza Vuetify e `<html lang>` com o idioma inicial; chamado uma vez no boot. */
export function applyInitialLocale(): void {
  apply(i18n.global.locale.value)
}
