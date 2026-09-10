export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${POKEAPI_BASE_URL}${path}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar à PokéAPI')
  }

  if (!response.ok) {
    throw new ApiError(`PokéAPI respondeu com status ${response.status}`, response.status)
  }

  return (await response.json()) as T
}
