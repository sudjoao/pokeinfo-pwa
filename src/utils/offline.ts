import { POKEAPI_BASE_URL } from '@/services/pokeapi/client'
import { artworkSrc, cryUrl, HERO_ARTWORK_SIZE } from './pokemon'

/**
 * Pacotes do "Usar offline": as mesmas URLs que as telas pedem, guardadas em caches próprios
 * (fora dos limites de entradas dos caches normais). O service worker consulta esses caches quando
 * o cache da regra não tem a resposta (ver `offlineFallback` em vite.config.ts).
 */
export const OFFLINE_PACKS = ['data', 'images', 'cries'] as const
export type OfflinePack = (typeof OFFLINE_PACKS)[number]

/** Nomes dos caches; mudar a versão daqui exige mudar o plugin do service worker junto. */
export const OFFLINE_CACHES: Record<OfflinePack, string> = {
  data: 'pokeinfo-offline-data-v1',
  images: 'pokeinfo-offline-images-v1',
  cries: 'pokeinfo-offline-cries-v1',
}

/** Lado do artwork no card da lista (o detalhe usa HERO_ARTWORK_SIZE). */
const CARD_ARTWORK_SIZE = 120

/**
 * KB guardados por Pokémon em cada geração, medidos em 2026-10-23 (o navegador guarda a resposta
 * descompactada). A ficha (`/pokemon`) encolhe nas gerações novas porque a lista de golpes por
 * jogo é menor; espécie e cadeia de evolução somam ~35 KB até a 8ª geração.
 */
const DATA_KB_BY_GENERATION = [335, 330, 320, 280, 200, 150, 125, 95, 50]
const IMAGES_KB = 33
const CRIES_KB = 7

export function estimateKb(pack: OfflinePack, generation: number): number {
  if (pack === 'images') return IMAGES_KB
  if (pack === 'cries') return CRIES_KB
  return DATA_KB_BY_GENERATION[generation - 1] ?? 100
}

/** Estimativa de um pacote para as espécies escolhidas (`byGeneration`: geração -> ids). */
export function estimatePackMb(
  pack: OfflinePack,
  byGeneration: ReadonlyMap<number, readonly number[]>,
): number {
  let kb = 0
  for (const [generation, ids] of byGeneration) kb += estimateKb(pack, generation) * ids.length
  return kb / 1024
}

/**
 * URLs de um Pokémon num pacote. A cadeia de evolução só se conhece pela espécie, por isso o
 * pacote de dados tem uma segunda etapa (ver `chainUrl`).
 */
export function packUrls(pack: OfflinePack, id: number): string[] {
  if (pack === 'images')
    return [artworkSrc(id, CARD_ARTWORK_SIZE), artworkSrc(id, HERO_ARTWORK_SIZE)]
  if (pack === 'cries') return [cryUrl(id)]
  return [`${POKEAPI_BASE_URL}/pokemon/${id}`, `${POKEAPI_BASE_URL}/pokemon-species/${id}`]
}

/** URL da cadeia de evolução no mesmo formato que a tela pede (`/evolution-chain/{id}`). */
export function chainUrl(speciesJson: unknown): string | null {
  const url = (speciesJson as { evolution_chain?: { url?: string } } | null)?.evolution_chain?.url
  const id = url?.replace(/\/$/, '').split('/').pop()
  return id && /^\d+$/.test(id) ? `${POKEAPI_BASE_URL}/evolution-chain/${id}` : null
}
