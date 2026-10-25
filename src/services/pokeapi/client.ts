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

/**
 * Segmentos como os da PokéAPI ("pokemon/25", "move/thunderbolt", "pokemon?limit=100000&offset=0").
 * Parte do caminho vem da URL do app (`/item/:slug`): sem esta checagem, um link com "..", "%2F" ou
 * "?" levaria o app a pedir (e guardar no cache) outro recurso que não o da tela.
 */
const SAFE_PATH = /^(\/[a-z0-9-]+)+\/?(\?limit=\d+&offset=\d+)?$/i

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  // Mesmo tratamento de um recurso que não existe: a tela mostra "não encontrado".
  if (!SAFE_PATH.test(path)) throw new ApiError('http', 404)

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
