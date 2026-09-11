import { ApiError } from '@/services/pokeapi/client'
import type { Translate } from '@/utils/evolution'

/** Mensagem traduzida para um erro de carregamento; `fallbackKey` cobre erros inesperados. */
export function describeError(error: unknown, t: Translate, fallbackKey: string): string {
  if (error instanceof ApiError) {
    return error.kind === 'http' ? t('error.http', { status: error.status }) : t('error.network')
  }
  return t(fallbackKey)
}
