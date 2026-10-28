import type { RegionMap } from './types'

/**
 * Mapa de cada seção de `data/routeOrder.ts` (chave `routes.section.*`), um arquivo por região,
 * baixado só quando o mapa daquela seção abre. "Outros encontros" não tem mapa.
 */
const LOADERS: Readonly<Record<string, () => Promise<RegionMap>>> = {
  kanto: () => import('./kanto').then((m) => m.KANTO_MAP),
  sevii: () => import('./sevii').then((m) => m.SEVII_MAP),
  johto: () => import('./johto').then((m) => m.JOHTO_MAP),
  hoenn: () => import('./hoenn').then((m) => m.HOENN_MAP),
  sinnoh: () => import('./sinnoh').then((m) => m.SINNOH_MAP),
  unova: () => import('./unova').then((m) => m.UNOVA_MAP),
  kalos: () => import('./kalos').then((m) => m.KALOS_MAP),
  alola: () => import('./alola').then((m) => m.ALOLA_MAP),
  galar: () => import('./galar').then((m) => m.GALAR_MAP),
  isleOfArmor: () => import('./isleOfArmor').then((m) => m.ISLE_OF_ARMOR_MAP),
  crownTundra: () => import('./crownTundra').then((m) => m.CROWN_TUNDRA_MAP),
}

export const MAP_SECTIONS: readonly string[] = Object.keys(LOADERS)

export function hasRegionMap(sectionKey: string): boolean {
  return sectionKey in LOADERS
}

export function loadRegionMap(sectionKey: string): Promise<RegionMap> {
  const loader = LOADERS[sectionKey]
  return loader ? loader() : Promise.reject(new Error(`Sem mapa para a seção "${sectionKey}"`))
}
