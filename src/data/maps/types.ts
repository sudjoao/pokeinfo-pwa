/**
 * Formato dos mapas da aba "Rotas" (um por seção de `data/routeOrder.ts`: Kanto, Ilhas Sevii,
 * Johto…). Desenho próprio, esquemático: cidades viram estações, rotas viram linhas com uma placa
 * numerada e cavernas/florestas/torres viram marcadores com ícone. O relevo é simplificado e só
 * serve para orientar; as posições seguem a geografia dos jogos, não o pixel de nenhum mapa oficial.
 *
 * Coordenadas em unidades do `viewBox` (x para o leste, y para o sul). Uma unidade vira 1 px no
 * zoom 100%, e os textos têm tamanho fixo em unidades, então mapas com mais locais são maiores.
 */

export type MapPoint = readonly [x: number, y: number]

/** Ícone e tamanho do marcador. `city` e `town` são círculos; os outros, quadrados com ícone. */
export type MapPlaceKind =
  | 'city'
  | 'town'
  | 'cave'
  | 'forest'
  | 'tower'
  | 'building'
  | 'water'
  | 'mountain'
  | 'ruins'
  | 'field'
  | 'island'
  | 'special'

/** Lado do marcador em que fica o nome (`none` esconde o nome; o leitor de tela ainda o lê). */
export type MapLabelSide = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'none'

export interface MapPlace {
  /** Slug do local na PokéAPI (o mesmo de `data/routeOrder.ts`). */
  location: string
  kind: MapPlaceKind
  at: MapPoint
  /** Padrão: `s` (abaixo do marcador). */
  label?: MapLabelSide
  /** Jogos (slugs de `data/games.ts`) em que o local existe; sem isso, existe em todos do mapa. */
  only?: readonly string[]
}

/** `land`: estrada; `water`: rota por mar (surf); `cave`: túnel ou passagem subterrânea. */
export type MapRouteKind = 'land' | 'water' | 'cave'

export interface MapRoute {
  /**
   * Slug da rota na PokéAPI (ex.: "kanto-route-1"); a placa mostra o número. Sem `location`, é só
   * uma ligação entre dois lugares (ex.: o portão até uma caverna), sem placa e sem toque. Caminho
   * com nome e sem número ("kindle-road") ganha uma placa só com ícone: prefira um `MapPlace` no
   * meio da ligação, para o nome aparecer.
   */
  location?: string
  path: readonly MapPoint[]
  /** Padrão: `land`. */
  kind?: MapRouteKind
  /** Onde fica a placa; padrão: no meio do caminho. */
  badge?: MapPoint
  only?: readonly string[]
}

/**
 * Manchas do desenho, na ordem em que são pintadas (terra primeiro, relevo por cima). `points` é o
 * contorno; com `smooth` (padrão), as quinas viram curvas.
 */
export type MapAreaKind = 'land' | 'mountain' | 'forest' | 'snow' | 'sand' | 'water' | 'lava'

export interface MapArea {
  kind: MapAreaKind
  points: readonly MapPoint[]
  smooth?: boolean
  only?: readonly string[]
}

/** Texto solto no mapa, só decorativo (nome de mar, de região vizinha). */
export interface MapCaption {
  text: string
  at: MapPoint
  only?: readonly string[]
}

export interface RegionMap {
  width: number
  height: number
  areas: readonly MapArea[]
  routes: readonly MapRoute[]
  places: readonly MapPlace[]
  captions?: readonly MapCaption[]
  /**
   * Locais da seção que não têm um ponto no mapa (navio, céu, outra dimensão, eventos): aparecem
   * como botões abaixo do desenho. Um teste garante que todo local com dado está no mapa ou aqui.
   */
  offMap?: readonly string[]
}
