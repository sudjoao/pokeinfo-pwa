export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'

export type ApiErrorKind = 'network' | 'http'

/** Erro da PokéAPI. A mensagem para o usuário é montada na interface, no idioma atual. */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
  ) {
    super(
      kind === 'http' ? `PokéAPI responded with status ${status}` : 'Could not reach the PokéAPI',
    )
    this.name = 'ApiError'
  }
}

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${POKEAPI_BASE_URL}${path}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('network')
  }

  if (!response.ok) {
    throw new ApiError('http', response.status)
  }

  return (await response.json()) as T
}
