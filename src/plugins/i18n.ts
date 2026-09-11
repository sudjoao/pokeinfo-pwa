import { createI18n } from 'vue-i18n'
import ptBR from '@/locales/pt-BR.json'
import en from '@/locales/en.json'
import { readStorage } from '@/utils/storage'

export const LOCALES = ['pt-BR', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_KEY = 'pokeinfo:locale:v1'

/** O português é a referência; o inglês precisa ter exatamente as mesmas chaves (o type-check acusa). */
export type MessageSchema = typeof ptBR
const enMessages: MessageSchema = en

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value)
}

/** Idioma salvo pelo usuário ou, na primeira abertura, o do aparelho (português só para `pt-*`). */
export function initialLocale(): Locale {
  const saved = readStorage<string>(LOCALE_KEY)
  if (isLocale(saved)) return saved
  const device = typeof navigator === 'undefined' ? '' : navigator.language
  return device.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

const messages: Record<Locale, MessageSchema> = { 'pt-BR': ptBR, en: enMessages }

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages,
})
