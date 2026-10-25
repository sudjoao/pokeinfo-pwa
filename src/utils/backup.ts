import type { PersistedGameSet } from '@/stores/gameSet'
import type { PersistedHunts, ShinyHunt } from '@/stores/shiny'
import { parseDaily, type PersistedDaily } from './daily'

/**
 * Backup de tudo o que o usuário marca no aparelho. Os conjuntos já ficam como bitsets em base64,
 * então o arquivo é pequeno (alguns KB) e cabe num link (`/?backup=`), útil para passar do Mac para
 * o iPhone sem conta nem servidor.
 */
export interface Backup {
  app: 'pokeinfo'
  version: 1
  exportedAt: string
  caught: PersistedGameSet
  shiny: PersistedGameSet
  favorites: string
  hunts: PersistedHunts
  /** Estatísticas do "Pokémon do dia"; ausente nos backups anteriores à 1.6 (o formato não mudou). */
  daily?: PersistedDaily
}

export type BackupData = Omit<Backup, 'app' | 'version' | 'exportedAt'>

export function createBackup(data: BackupData, now = new Date()): Backup {
  return { app: 'pokeinfo', version: 1, exportedAt: now.toISOString(), ...data }
}

/** Slug de jogo ("scarlet-violet") e chave de caçada ("scarlet-violet:906"). */
const GAME_KEY = /^[a-z0-9-]{1,40}$/
const HUNT_KEY = /^[a-z0-9-]{1,40}:\d{1,6}$/

/**
 * Maior bitset aceito de fora: 4096 caracteres em base64 cobrem ids até ~24 mil (as formas vão até
 * ~10 300). Um backup adulterado com um bitset de megabytes travaria a tela ao virar um Set enorme.
 */
const MAX_BITSET_LENGTH = 4096
/** Contador de caçada acima disso só pode ser dado adulterado. */
const MAX_HUNT_COUNT = 10_000_000

/** Arquivo de backup acima disso não é do PokeInfo (uma coleção completa tem ~30 KB). */
export const MAX_BACKUP_BYTES = 1024 * 1024

function isBitset(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_BITSET_LENGTH
}

export function isHunt(value: unknown): value is ShinyHunt {
  const hunt = value as ShinyHunt
  return (
    typeof hunt === 'object' &&
    hunt !== null &&
    Number.isInteger(hunt.count) &&
    hunt.count >= 0 &&
    hunt.count <= MAX_HUNT_COUNT &&
    typeof hunt.charm === 'boolean' &&
    typeof hunt.masuda === 'boolean'
  )
}

function entriesOf(value: unknown): [string, unknown][] {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.entries(value)
    : []
}

/**
 * Só as entradas válidas: chave no formato esperado (o que também barra "__proto__") e valor do
 * tipo certo. Uma entrada ruim não derruba as outras.
 */
function parseGameSets(value: unknown): PersistedGameSet {
  return Object.fromEntries(
    entriesOf(value).filter(([game, bits]) => GAME_KEY.test(game) && isBitset(bits)),
  ) as PersistedGameSet
}

function parseHunts(value: unknown): PersistedHunts {
  const result: PersistedHunts = {}
  for (const [key, hunt] of entriesOf(value)) {
    if (!HUNT_KEY.test(key) || !isHunt(hunt)) continue
    result[key] = {
      count: hunt.count,
      charm: hunt.charm,
      masuda: hunt.masuda,
      startedAt:
        typeof hunt.startedAt === 'string' && hunt.startedAt.length <= 40 ? hunt.startedAt : '',
    }
  }
  return result
}

/**
 * Valida os dados de um backup (ou da coleção salva na conta): campos ausentes ou inválidos viram
 * vazios. Nunca confia no que veio de fora do aparelho.
 */
export function parseBackupData(value: unknown): BackupData {
  const data = (typeof value === 'object' && value !== null ? value : {}) as Partial<BackupData>
  const daily = parseDaily(data.daily)
  return {
    caught: parseGameSets(data.caught),
    shiny: parseGameSets(data.shiny),
    favorites: isBitset(data.favorites) ? data.favorites : '',
    hunts: parseHunts(data.hunts),
    ...(daily ? { daily } : {}),
  }
}

/** Valida um backup lido de arquivo ou link; null quando não é um backup do PokeInfo. */
export function parseBackup(text: string): Backup | null {
  if (text.length > MAX_BACKUP_BYTES) return null
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  const backup = value as Partial<Backup>
  if (backup?.app !== 'pokeinfo' || backup.version !== 1) return null
  return {
    app: 'pokeinfo',
    version: 1,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : '',
    ...parseBackupData(backup),
  }
}

/** JSON -> base64url (seguro na URL, sem "+", "/" nem "="). */
export function encodeBackupParam(backup: Backup): string {
  const bytes = new TextEncoder().encode(JSON.stringify(backup))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBackupParam(param: string): Backup | null {
  try {
    const base64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return parseBackup(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** Nome do arquivo: pokeinfo-backup-2026-10-23.json */
export function backupFileName(now = new Date()): string {
  return `pokeinfo-backup-${now.toISOString().slice(0, 10)}.json`
}
