/** Leitura/escrita segura no localStorage (pode não existir ou lançar em modo privado). */

export function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem espaço ou storage indisponível: o app segue funcionando só em memória.
  }
}
