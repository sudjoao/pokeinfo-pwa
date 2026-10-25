import { createI18n } from 'vue-i18n'
import type ptBR from '@/locales/pt-BR.json'
import { readStorage } from '@/utils/storage'

export const LOCALES = ['pt-BR', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_KEY = 'pokeinfo:locale:v1'

/** O português é a referência; os demais precisam ter exatamente as mesmas chaves (o type-check acusa). */
export type MessageSchema = typeof ptBR

/**
 * Cada idioma é um chunk separado (~43 KB): só o usado entra no carregamento. A tipagem do
 * retorno mantém a checagem de que en/es têm as mesmas chaves do pt-BR.
 */
const loaders: Record<Locale, () => Promise<{ default: MessageSchema }>> = {
  'pt-BR': () => import('@/locales/pt-BR.json'),
  en: () => import('@/locales/en.json'),
  es: () => import('@/locales/es.json'),
}

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value)
}

/**
 * Idioma salvo pelo usuário ou, na primeira abertura, o do aparelho (`pt-*` -> pt-BR, `es-*` -> es,
 * senão en). O index.html repete esta regra para pré-carregar as mensagens (build/preloadLocale.ts).
 */
export function initialLocale(): Locale {
  const saved = readStorage<string>(LOCALE_KEY)
  if (isLocale(saved)) return saved
  const device = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase()
  if (device.startsWith('pt')) return 'pt-BR'
  if (device.startsWith('es')) return 'es'
  return 'en'
}

export const i18n = createI18n<[MessageSchema], Locale, false>({
  legacy: false,
  locale: initialLocale(),
  // Todos os idiomas têm as mesmas chaves: não há o que buscar em outro (e ele nem estaria carregado).
  fallbackLocale: false,
  messages: {} as Record<Locale, MessageSchema>,
})

const loaded = new Set<Locale>()

/** Baixa as mensagens do idioma (uma vez só). Precisa terminar antes de trocar `locale`. */
export async function loadLocaleMessages(locale: Locale): Promise<void> {
  if (loaded.has(locale)) return
  const messages = await loaders[locale]()
  i18n.global.setLocaleMessage(locale, messages.default)
  loaded.add(locale)
}
