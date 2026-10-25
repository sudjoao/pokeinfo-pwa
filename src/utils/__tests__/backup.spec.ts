import { describe, expect, it } from 'vitest'
import {
  backupFileName,
  createBackup,
  decodeBackupParam,
  encodeBackupParam,
  parseBackup,
} from '@/utils/backup'
import { encodeBitset } from '@/utils/bitset'

const data = {
  caught: { 'scarlet-violet': encodeBitset(new Set([906, 909, 912])) },
  shiny: {},
  favorites: encodeBitset(new Set([25, 10100])),
  hunts: { 'scarlet-violet:906': { count: 42, charm: true, masuda: false, startedAt: '' } },
}

describe('backup', () => {
  it('arquivo vai e volta', () => {
    const backup = createBackup(data, new Date('2026-10-23T10:00:00Z'))
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup)
  })

  it('link vai e volta e não tem caracteres reservados', () => {
    const backup = createBackup(data)
    const param = encodeBackupParam(backup)
    expect(param).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeBackupParam(param)).toEqual(backup)
  })

  it('rejeita o que não é backup do PokeInfo', () => {
    expect(parseBackup('{"app":"outro","version":1}')).toBeNull()
    expect(parseBackup('não é json')).toBeNull()
    expect(decodeBackupParam('%%%')).toBeNull()
  })

  it('campos inválidos viram vazios', () => {
    const parsed = parseBackup('{"app":"pokeinfo","version":1,"caught":[1,2],"favorites":3}')
    expect(parsed?.caught).toEqual({})
    expect(parsed?.favorites).toBe('')
  })

  it('nome do arquivo com a data', () => {
    expect(backupFileName(new Date('2026-10-23T10:00:00Z'))).toBe('pokeinfo-backup-2026-10-23.json')
  })
})

describe('backup com o Pokémon do dia', () => {
  it('campo opcional: backup antigo continua válido e o novo leva as estatísticas', () => {
    const old = parseBackup(
      '{"app":"pokeinfo","version":1,"caught":{},"shiny":{},"favorites":"","hunts":{}}',
    )
    expect(old).not.toBeNull()
    expect(old!.daily).toBeUndefined()
    const daily = {
      stats: {
        played: 3,
        won: 2,
        streak: 1,
        best: 2,
        lastWon: '2026-10-25',
        distribution: [0, 1, 1, 0, 0, 0, 0, 0],
      },
      game: { day: '2026-10-25', guesses: [25, 6], done: true },
    }
    const withDaily = parseBackup(JSON.stringify({ ...JSON.parse(JSON.stringify(old)), daily }))
    expect(withDaily!.daily).toEqual(daily)
    expect(parseBackup(JSON.stringify({ ...old, daily: { stats: 'x' } }))!.daily).toBeUndefined()
  })

  it('descarta dados adulterados: bitset enorme, chaves longas, contadores absurdos', () => {
    const backup = createBackup(data)
    const tampered = {
      ...backup,
      caught: { ...backup.caught, ['x'.repeat(41)]: '', huge: 'A'.repeat(5000) },
      favorites: 'A'.repeat(5000),
      hunts: {
        ...backup.hunts,
        'scarlet-violet:1': { count: 1e12, charm: false, masuda: false, startedAt: '' },
        'scarlet-violet:2': { count: 3, charm: false, masuda: false, startedAt: 'x'.repeat(41) },
      },
    }
    const parsed = parseBackup(JSON.stringify(tampered))!
    expect(parsed.caught).toEqual(backup.caught)
    expect(parsed.favorites).toBe('')
    expect(Object.keys(parsed.hunts)).toEqual(['scarlet-violet:906', 'scarlet-violet:2'])
    expect(parsed.hunts['scarlet-violet:2']!.startedAt).toBe('')
  })

  it('não tenta ler texto grande demais para ser backup', () => {
    expect(parseBackup(' '.repeat(1024 * 1024 + 1))).toBeNull()
  })

  it('estatísticas do dia só com os campos conhecidos e contadores válidos', () => {
    const daily = {
      stats: {
        played: 5,
        won: -1,
        streak: 1.5,
        best: 2,
        lastWon: '<b>',
        distribution: [1, 'x', 2, 0, 0, 0, 0, 0, 9, 9, 9],
        extra: 'x'.repeat(100),
      },
      game: { day: '2026-10-25', guesses: Array.from({ length: 20 }, (_, i) => i + 1), done: 1 },
    }
    const parsed = parseBackup(JSON.stringify({ ...createBackup(data), daily }))!.daily!
    expect(parsed.stats).toEqual({
      played: 5,
      won: 0,
      streak: 0,
      best: 2,
      lastWon: null,
      distribution: [1, 0, 2, 0, 0, 0, 0, 0],
    })
    expect(parsed.game).toEqual({
      day: '2026-10-25',
      guesses: [1, 2, 3, 4, 5, 6, 7, 8],
      done: true,
    })
  })
})
