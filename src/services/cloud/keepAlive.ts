import type { SupabaseClient } from '@supabase/supabase-js'
import { readStorage, writeStorage } from '@/utils/storage'

/**
 * O plano Free do Supabase pausa o projeto depois de uma semana com pouca atividade no banco
 * ("a few requests to the database each day" é o suficiente para ficar de pé). Com um só usuário
 * de verdade, os dias sem abrir o app contam como inatividade. Enquanto o app estiver aberto na
 * conta do dono do projeto, este módulo faz algumas consultas a mais à tabela dele depois de cada
 * sincronização, no máximo uma rodada a cada 12 h por aparelho. O complemento, para os dias em que
 * o app não é aberto, é o workflow `.github/workflows/keepalive.yml`.
 */

/** SHA-256 (hex) dos e-mails do dono, em minúsculas: o repositório é público, então nada em claro. */
const OWNER_EMAIL_HASHES = new Set([
  '5a0391a79b023534ffd795b982a26b5ffea894234e21364c488e29f1743a6c21',
  '284f3d5cb6937f4f18b7bc0f7eafcecea44da517c59ef7c8c6abc8f17ca09eb9',
])

export const KEEP_ALIVE_KEY = 'pokeinfo:keepalive:v1'
/** Intervalo mínimo entre duas rodadas no mesmo aparelho. */
export const KEEP_ALIVE_INTERVAL = 12 * 60 * 60 * 1000
/** Consultas por rodada (além da leitura que a própria sincronização já fez). */
export const KEEP_ALIVE_REQUESTS = 4

const TABLE = 'user_collections'

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** O e-mail é de quem mantém o projeto? (comparado por hash, sem distinguir maiúsculas) */
export async function isOwnerEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = email?.trim().toLowerCase()
  if (!normalized || typeof crypto === 'undefined' || !crypto.subtle) return false
  try {
    return OWNER_EMAIL_HASHES.has(await sha256Hex(normalized))
  } catch {
    return false
  }
}

/** Já passou o intervalo desde a última rodada deste aparelho? */
export function keepAliveDue(now = Date.now()): boolean {
  const last = readStorage<number>(KEEP_ALIVE_KEY)
  return typeof last !== 'number' || now - last >= KEEP_ALIVE_INTERVAL
}

/**
 * Uma rodada de consultas leves à própria linha (passam pela RLS como qualquer leitura do app).
 * Devolve `true` se rodou. Erros não propagam: isto nunca pode atrapalhar a sincronização.
 */
export async function keepAlive(
  client: SupabaseClient,
  userId: string,
  now = Date.now(),
): Promise<boolean> {
  if (!keepAliveDue(now)) return false
  // Gravado antes de pedir: uma falha de rede não vira uma rajada a cada sincronização.
  writeStorage(KEEP_ALIVE_KEY, now)
  const columns = ['version', 'updated_at', 'version,updated_at', 'user_id']
  for (let index = 0; index < KEEP_ALIVE_REQUESTS; index++) {
    try {
      await client
        .from(TABLE)
        .select(columns[index % columns.length]!)
        .eq('user_id', userId)
        .limit(1)
    } catch {
      return true
    }
  }
  return true
}
