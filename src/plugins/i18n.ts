import { createI18n } from 'vue-i18n'
import ptBR from '@/locales/pt-BR.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import { readStorage } from '@/utils/storage'

export const LOCALES = ['pt-BR', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_KEY = 'pokeinfo:locale:v1'

/** O português é a referência; os demais precisam ter exatamente as mesmas chaves (o type-check acusa). */
export type MessageSchema = typeof ptBR
const enMessages: MessageSchema = en
const esMessages: MessageSchema = es

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value)
}

/** Idioma salvo pelo usuário ou, na primeira abertura, o do aparelho (`pt-*` -> pt-BR, `es-*` -> es, senão en). */
export function initialLocale(): Locale {
  const saved = readStorage<string>(LOCALE_KEY)
  if (isLocale(saved)) return saved
  const device = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase()
  if (device.startsWith('pt')) return 'pt-BR'
  if (device.startsWith('es')) return 'es'
  return 'en'
}

const messages: Record<Locale, MessageSchema> = { 'pt-BR': ptBR, en: enMessages, es: esMessages }

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages,
})
