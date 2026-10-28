import type { RegionMap } from './types'

/** Rotas 47/48, a Safari Zone e a Embedded Tower só existem em HeartGold/SoulSilver. */
const HGSS = ['heartgold-soulsilver']

/**
 * Johto (Gold/Silver, Crystal e HeartGold/SoulSilver). New Bark fica no sudeste, na divisa com
 * Kanto; a jornada sobe para Violet, desce pelo sul (Azalea, Ilex, Goldenrod) e volta ao norte
 * por Ecruteak, com Olivine na costa oeste, Cianwood do outro lado do mar e Mahogany e Blackthorn
 * nas montanhas do nordeste. A leste, Rotas 27 e 26 levam à Victory Road e ao Indigo Plateau.
 */
export const JOHTO_MAP: RegionMap = {
  width: 1120,
  height: 680,
  areas: [
    {
      kind: 'land',
      points: [
        [205, -30],
        [1150, -30],
        [1150, 590],
        [1060, 602],
        [970, 566],
        [900, 574],
        [840, 584],
        [760, 578],
        [700, 572],
        [650, 604],
        [590, 640],
        [520, 648],
        [440, 624],
        [372, 612],
        [345, 562],
        [345, 470],
        [322, 400],
        [272, 350],
        [222, 322],
        [212, 240],
        [204, 120],
      ],
    },
    // Cianwood e os penhascos a oeste (Rotas 47/48 e a Safari Zone em HGSS).
    {
      kind: 'land',
      points: [
        [28, 120],
        [160, 112],
        [176, 262],
        [150, 400],
        [166, 492],
        [110, 532],
        [40, 516],
        [24, 380],
      ],
    },
    // Whirl Islands.
    {
      kind: 'land',
      points: [
        [176, 464],
        [212, 456],
        [228, 484],
        [198, 502],
        [172, 490],
      ],
    },
    // Mt. Mortar, Dark Cave, Union Cave e a serra da Victory Road.
    {
      kind: 'mountain',
      points: [
        [532, 118],
        [624, 112],
        [640, 168],
        [606, 204],
        [540, 196],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [698, 296],
        [760, 290],
        [778, 336],
        [744, 368],
        [700, 356],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [556, 474],
        [606, 470],
        [614, 512],
        [582, 530],
        [552, 514],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [1012, 92],
        [1108, 88],
        [1116, 196],
        [1066, 222],
        [1014, 196],
      ],
    },
    {
      kind: 'snow',
      points: [
        [728, 128],
        [796, 124],
        [806, 186],
        [764, 200],
        [724, 186],
      ],
    },
    // Ilex Forest e o National Park.
    {
      kind: 'forest',
      points: [
        [358, 532],
        [444, 530],
        [452, 582],
        [402, 604],
        [358, 586],
      ],
    },
    {
      kind: 'forest',
      points: [
        [358, 218],
        [442, 214],
        [452, 262],
        [404, 284],
        [356, 268],
      ],
    },
    // Lake of Rage, o lago do Dragon's Den e o rio das Tohjo Falls.
    {
      kind: 'water',
      points: [
        [628, 22],
        [712, 16],
        [724, 70],
        [672, 90],
        [624, 68],
      ],
    },
    {
      kind: 'water',
      points: [
        [802, 60],
        [862, 54],
        [870, 100],
        [832, 112],
        [800, 96],
      ],
    },
  ],
  routes: [
    {
      location: 'johto-route-29',
      path: [
        [880, 520],
        [680, 520],
      ],
      badge: [822, 520],
    },
    {
      location: 'johto-route-46',
      path: [
        [760, 520],
        [760, 400],
      ],
      badge: [760, 462],
    },
    {
      location: 'johto-route-30',
      path: [
        [680, 520],
        [680, 300],
      ],
      badge: [680, 420],
    },
    {
      location: 'johto-route-31',
      path: [
        [680, 300],
        [580, 300],
      ],
      badge: [630, 300],
    },
    {
      location: 'johto-route-32',
      path: [
        [580, 300],
        [580, 500],
      ],
      badge: [580, 445],
    },
    {
      location: 'johto-route-33',
      path: [
        [580, 500],
        [580, 560],
        [490, 560],
      ],
      badge: [535, 560],
    },
    {
      location: 'johto-route-34',
      path: [
        [400, 560],
        [400, 420],
      ],
      badge: [400, 492],
    },
    {
      location: 'johto-route-35',
      path: [
        [400, 420],
        [400, 300],
      ],
      badge: [400, 360],
    },
    {
      location: 'johto-route-36',
      path: [
        [400, 300],
        [580, 300],
      ],
      badge: [445, 300],
    },
    {
      location: 'johto-route-37',
      path: [
        [490, 300],
        [490, 160],
      ],
      badge: [490, 232],
    },
    {
      location: 'johto-route-38',
      path: [
        [490, 160],
        [250, 160],
      ],
      badge: [370, 160],
    },
    {
      location: 'johto-route-39',
      path: [
        [250, 160],
        [250, 300],
      ],
      badge: [250, 230],
    },
    {
      location: 'johto-sea-route-40',
      path: [
        [250, 300],
        [250, 400],
      ],
      kind: 'water',
      badge: [250, 362],
    },
    {
      location: 'johto-sea-route-41',
      path: [
        [250, 400],
        [200, 440],
        [100, 450],
      ],
      kind: 'water',
      badge: [150, 446],
    },
    {
      location: 'johto-route-47',
      path: [
        [100, 450],
        [100, 330],
      ],
      badge: [100, 410],
      only: HGSS,
    },
    {
      location: 'johto-route-48',
      path: [
        [100, 330],
        [100, 230],
      ],
      badge: [100, 284],
      only: HGSS,
    },
    {
      location: 'johto-route-42',
      path: [
        [490, 160],
        [670, 160],
      ],
      badge: [535, 160],
    },
    {
      location: 'johto-route-43',
      path: [
        [670, 160],
        [670, 62],
      ],
      badge: [670, 118],
    },
    {
      location: 'johto-route-44',
      path: [
        [670, 160],
        [760, 160],
      ],
      badge: [715, 160],
    },
    {
      location: 'johto-route-45',
      path: [
        [830, 160],
        [830, 340],
        [760, 400],
      ],
      badge: [830, 262],
    },
    {
      location: 'kanto-route-27',
      path: [
        [940, 520],
        [1060, 520],
      ],
      badge: [1006, 520],
    },
    {
      location: 'kanto-route-26',
      path: [
        [1060, 520],
        [1060, 150],
      ],
      badge: [1060, 340],
    },
    // Ligações sem placa: trilhas até cavernas, torres e portões, e o trecho de surf da Rota 27.
    {
      path: [
        [880, 520],
        [940, 520],
      ],
      kind: 'water',
    },
    {
      path: [
        [760, 160],
        [830, 160],
      ],
      kind: 'cave',
    },
    {
      path: [
        [680, 300],
        [730, 330],
      ],
      kind: 'cave',
    },
    {
      path: [
        [760, 400],
        [730, 330],
      ],
      kind: 'cave',
    },
    {
      path: [
        [580, 300],
        [580, 255],
      ],
    },
    {
      path: [
        [580, 160],
        [580, 125],
      ],
    },
    {
      path: [
        [580, 392],
        [510, 392],
      ],
    },
    {
      path: [
        [400, 560],
        [490, 560],
      ],
    },
    {
      path: [
        [490, 560],
        [490, 605],
      ],
    },
    {
      path: [
        [400, 300],
        [400, 250],
      ],
    },
    {
      path: [
        [200, 440],
        [200, 480],
      ],
      kind: 'water',
    },
    {
      path: [
        [830, 160],
        [830, 80],
      ],
      kind: 'water',
    },
    {
      path: [
        [670, 160],
        [705, 188],
      ],
    },
    {
      path: [
        [1060, 150],
        [1060, 80],
      ],
    },
    {
      path: [
        [100, 360],
        [145, 360],
      ],
      only: HGSS,
    },
    {
      path: [
        [100, 230],
        [100, 150],
      ],
      only: HGSS,
    },
  ],
  places: [
    { location: 'new-bark-town', kind: 'town', at: [880, 520], label: 's' },
    { location: 'cherrygrove-city', kind: 'city', at: [680, 520], label: 's' },
    { location: 'violet-city', kind: 'city', at: [580, 300], label: 'sw' },
    { location: 'sprout-tower', kind: 'tower', at: [580, 255], label: 'e' },
    { location: 'dark-cave', kind: 'cave', at: [730, 330], label: 'e' },
    { location: 'ruins-of-alph', kind: 'ruins', at: [510, 392], label: 'w' },
    { location: 'union-cave', kind: 'cave', at: [580, 500], label: 'e' },
    { location: 'azalea-town', kind: 'town', at: [490, 560], label: 'n' },
    { location: 'slowpoke-well', kind: 'cave', at: [490, 605], label: 'e' },
    { location: 'ilex-forest', kind: 'forest', at: [400, 560], label: 's' },
    { location: 'goldenrod-city', kind: 'city', at: [400, 420], label: 'e' },
    { location: 'national-park', kind: 'field', at: [400, 250], label: 'n' },
    { location: 'ecruteak-city', kind: 'city', at: [490, 160], label: 'n' },
    { location: 'burned-tower', kind: 'tower', at: [430, 112], label: 'n' },
    { location: 'bell-tower', kind: 'tower', at: [528, 90], label: 'n' },
    { location: 'olivine-city', kind: 'city', at: [250, 300], label: 'e' },
    { location: 'whirl-islands', kind: 'island', at: [200, 480], label: 's' },
    { location: 'cianwood-city', kind: 'city', at: [100, 450], label: 's' },
    { location: 'embedded-tower', kind: 'tower', at: [145, 360], label: 'e', only: HGSS },
    { location: 'safari-zone-gate', kind: 'building', at: [100, 230], label: 'e', only: HGSS },
    { location: 'johto-safari-zone', kind: 'field', at: [100, 150], label: 'e', only: HGSS },
    { location: 'mt-mortar', kind: 'cave', at: [580, 125], label: 'n' },
    { location: 'mahogany-town', kind: 'town', at: [670, 160], label: 'nw' },
    { location: 'team-rocket-hq', kind: 'building', at: [705, 188], label: 'e' },
    { location: 'lake-of-rage', kind: 'water', at: [670, 52], label: 'e' },
    { location: 'ice-path', kind: 'cave', at: [760, 160], label: 'n' },
    { location: 'blackthorn-city', kind: 'city', at: [830, 160], label: 'e' },
    { location: 'dragons-den', kind: 'cave', at: [830, 80], label: 'e' },
    { location: 'tohjo-falls', kind: 'cave', at: [940, 520], label: 'n' },
    { location: 'kanto-victory-road-1', kind: 'cave', at: [1060, 150], label: 'w' },
    { location: 'indigo-plateau', kind: 'building', at: [1060, 80], label: 'w' },
  ],
  captions: [{ text: 'KANTO', at: [1000, 300] }],
  // As Sinjoh Ruins ficam longe de Johto (chega-se por um evento em Mt. Silver).
  offMap: ['sinjoh-ruins'],
}
