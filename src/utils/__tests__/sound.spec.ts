import { describe, expect, it } from 'vitest'
import { initialSoundEnabled } from '@/utils/sound'

describe('initialSoundEnabled', () => {
  it('começa desligado na primeira visita', () => {
    expect(initialSoundEnabled(null, null)).toBe(false)
  })

  it('respeita a escolha salva', () => {
    expect(initialSoundEnabled(true, null)).toBe(true)
    expect(initialSoundEnabled(false, false)).toBe(false)
  })

  it('migra a chave antiga: só quem reativou o som continua com ele', () => {
    expect(initialSoundEnabled(null, false)).toBe(true)
    expect(initialSoundEnabled(null, true)).toBe(false)
  })
})
