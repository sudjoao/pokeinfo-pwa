import type { SupabaseClient, User } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Conta e sincronização só aparecem quando o build tem o projeto Supabase configurado. */
export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY)

/** Onde o Supabase guarda a sessão (prefixo do app, como as outras chaves do localStorage). */
export const AUTH_STORAGE_KEY = 'pokeinfo:auth:v1'

/** Há sessão salva neste aparelho? Lido sem carregar o SDK (que só vem quando precisa). */
export function hasStoredSession(): boolean {
  try {
    return Boolean(localStorage.getItem(AUTH_STORAGE_KEY))
  } catch {
    return false
  }
}

/**
 * Usuário da sessão salva, lido sem o SDK: o menu mostra a conta na hora (e offline). Só para
 * exibir; quem valida a sessão é o Supabase, que confirma ou desfaz logo depois.
 */
export function storedSessionUser(): User | null {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null') as {
      user?: User
    } | null
    return session?.user?.id ? session.user : null
  } catch {
    return null
  }
}

let client: Promise<SupabaseClient> | null = null

/**
 * Cliente do Supabase, baixado sob demanda (~50 KB gz): quem nunca entrou na conta não paga por
 * ele. Fluxo PKCE: o código que volta do Google só vira sessão com o verificador guardado neste
 * navegador. A troca é feita pela tela /auth/callback (`detectSessionInUrl: false`), que também
 * tira o código da URL.
 */
export function getClient(): Promise<SupabaseClient> {
  if (!cloudEnabled) return Promise.reject(new Error('Supabase is not configured'))
  client ??= import('@supabase/supabase-js').then(
    ({ createClient }) =>
      createClient(SUPABASE_URL!, SUPABASE_KEY!, {
        auth: {
          flowType: 'pkce',
          storageKey: AUTH_STORAGE_KEY,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }),
    (error: unknown) => {
      // Sem rede e sem o chunk em cache: tenta de novo na próxima vez.
      client = null
      throw error
    },
  )
  return client
}
