import { fetchJson } from './client'
import type { LocationAreaDto } from './dto'

/**
 * Encontros crus de uma área (`/location-area/{slug}`). Pode ter dezenas de entradas em covis
 * de Dynamax (uma por raridade); a agregação por rota fica em `utils/routes.ts`.
 */
export async function getLocationAreaEncounters(
  areaSlug: string,
  signal?: AbortSignal,
): Promise<LocationAreaDto> {
  return fetchJson<LocationAreaDto>(`/location-area/${areaSlug}`, signal)
}
