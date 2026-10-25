import type { SupabaseClient } from '@supabase/supabase-js'
import { parseBackupData, type BackupData } from '@/utils/backup'

/** Linha da tabela `user_collections` (supabase/migrations). */
export interface RemoteCollection {
  data: BackupData
  /** Versão controlada pelo servidor: trava otimista dos updates. */
  version: number
}

const TABLE = 'user_collections'

/** Duplicidade de chave primária: outro aparelho criou a linha primeiro. */
const UNIQUE_VIOLATION = '23505'

export async function fetchCollection(
  client: SupabaseClient,
  userId: string,
): Promise<RemoteCollection | null> {
  const { data, error } = await client
    .from(TABLE)
    .select('data, version')
    .eq('user_id', userId)
    .maybeSingle<{ data: unknown; version: number }>()
  if (error) throw error
  return data ? { data: parseBackupData(data.data), version: data.version } : null
}

/** Primeira gravação da conta. null quando a linha já existe (outro aparelho chegou antes). */
export async function createCollection(
  client: SupabaseClient,
  userId: string,
  collection: BackupData,
): Promise<number | null> {
  const { data, error } = await client
    .from(TABLE)
    .insert({ user_id: userId, data: collection })
    .select('version')
    .single<{ version: number }>()
  if (error?.code === UNIQUE_VIOLATION) return null
  if (error) throw error
  return data.version
}

/**
 * Grava só se ninguém gravou desde a versão lida. null = conflito: outro aparelho gravou antes e
 * quem chamou deve reler, mesclar e tentar de novo.
 */
export async function updateCollection(
  client: SupabaseClient,
  userId: string,
  collection: BackupData,
  version: number,
): Promise<number | null> {
  const { data, error } = await client
    .from(TABLE)
    .update({ data: collection })
    .eq('user_id', userId)
    .eq('version', version)
    .select('version')
    .maybeSingle<{ version: number }>()
  if (error) throw error
  return data?.version ?? null
}

/** Apaga a conta e a coleção (função `delete_account` no banco, só para o próprio usuário). */
export async function deleteAccount(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('delete_account')
  if (error) throw error
}
