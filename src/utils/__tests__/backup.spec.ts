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
