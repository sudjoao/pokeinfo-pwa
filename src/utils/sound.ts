/**
 * Preferência de som. Os gritos começam desligados: a pessoa liga pelo botão do cabeçalho.
 * A chave antiga guardava "mudo"; quem já tinha reativado o som (`false` explícito) continua com ele.
 */
export function initialSoundEnabled(saved: boolean | null, legacyMuted: boolean | null): boolean {
  if (saved !== null) return saved
  return legacyMuted === false
}
