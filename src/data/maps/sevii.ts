import type { MapPlace, RegionMap } from './types'

/** As sete câmaras de Tanoby, numa fileira ao longo da costa sul de Seven Island. */
const TANOBY_CHAMBERS: MapPlace[] = [
  'monean-chamber',
  'liptoo-chamber',
  'weepth-chamber',
  'dilford-chamber',
  'scufib-chamber',
  'rixy-chamber',
  'viapos-chamber',
].map((location, index) => ({
  location,
  kind: 'ruins',
  at: [330 + index * 60, 740],
  // Nomes alternados acima e abaixo, para não encostarem uns nos outros.
  label: index % 2 ? 'n' : 's',
}))

/**
 * Ilhas Sevii (FireRed/LeafGreen). One, Two e Three Island ficam juntas no nordeste (as da
 * história); Four a noroeste, Five no centro, Six a sudeste e Seven a sudoeste, com Tanoby na
 * costa sul. Navel Rock e Birth Island (ilhas de evento) ficam no canto, longe das outras.
 * Estradas sem número (Kindle Road, Bond Bridge, Water Path, Green Path) viram marcadores com nome.
 */
export const SEVII_MAP: RegionMap = {
  width: 960,
  height: 800,
  areas: [
    // One Island (Kindle Road e Mt. Ember ao norte, Treasure Beach ao sul).
    {
      kind: 'land',
      points: [
        [720, 200],
        [770, 40],
        [840, 40],
        [852, 150],
        [822, 262],
        [790, 352],
        [730, 352],
        [700, 282],
      ],
    },
    {
      kind: 'lava',
      points: [
        [772, 52],
        [838, 50],
        [846, 108],
        [804, 124],
        [772, 102],
      ],
    },
    // Two Island e Cape Brink.
    {
      kind: 'land',
      points: [
        [565, 90],
        [620, 60],
        [652, 120],
        [640, 230],
        [600, 256],
        [565, 222],
      ],
    },
    // Three Island e a ilhota da Berry Forest.
    {
      kind: 'land',
      points: [
        [680, 410],
        [760, 404],
        [782, 470],
        [752, 540],
        [690, 536],
        [668, 470],
      ],
    },
    {
      kind: 'land',
      points: [
        [524, 424],
        [586, 418],
        [598, 470],
        [560, 494],
        [520, 472],
      ],
    },
    {
      kind: 'forest',
      points: [
        [534, 432],
        [580, 428],
        [588, 466],
        [558, 482],
        [530, 466],
      ],
    },
    // Four Island e a neve da Icefall Cave.
    {
      kind: 'land',
      points: [
        [300, 90],
        [360, 50],
        [440, 80],
        [452, 190],
        [400, 242],
        [320, 222],
      ],
    },
    {
      kind: 'snow',
      points: [
        [318, 72],
        [400, 58],
        [422, 112],
        [372, 142],
        [316, 122],
      ],
    },
    // Five Island, a ilhota do Memorial Pillar e as ilhas do Resort Gorgeous.
    {
      kind: 'land',
      points: [
        [278, 382],
        [340, 350],
        [420, 340],
        [432, 400],
        [372, 462],
        [300, 462],
      ],
    },
    {
      kind: 'land',
      points: [
        [450, 400],
        [490, 396],
        [496, 442],
        [456, 450],
      ],
    },
    {
      kind: 'land',
      points: [
        [140, 395],
        [210, 390],
        [216, 450],
        [182, 506],
        [140, 496],
      ],
    },
    // Six Island, a Ruin Valley e a Outcast Island.
    {
      kind: 'land',
      points: [
        [556, 612],
        [640, 580],
        [722, 592],
        [742, 652],
        [700, 692],
        [600, 692],
        [554, 662],
      ],
    },
    {
      kind: 'land',
      points: [
        [790, 500],
        [852, 494],
        [872, 560],
        [822, 582],
        [786, 560],
      ],
    },
    {
      kind: 'land',
      points: [
        [458, 580],
        [522, 588],
        [532, 660],
        [490, 692],
        [454, 650],
      ],
    },
    // Seven Island, o Sevault Canyon e a costa de Tanoby.
    {
      kind: 'land',
      points: [
        [210, 480],
        [300, 470],
        [322, 560],
        [302, 700],
        [292, 772],
        [200, 776],
        [170, 690],
        [200, 600],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [185, 650],
        [250, 645],
        [256, 714],
        [202, 726],
        [176, 700],
      ],
    },
    {
      kind: 'land',
      points: [
        [288, 726],
        [700, 722],
        [712, 752],
        [288, 758],
      ],
    },
    // Navel Rock e Birth Island, longe das outras.
    {
      kind: 'land',
      points: [
        [58, 72],
        [102, 68],
        [108, 108],
        [66, 114],
      ],
    },
    {
      kind: 'land',
      points: [
        [58, 182],
        [102, 178],
        [108, 218],
        [66, 224],
      ],
    },
  ],
  routes: [
    // Trilhas e travessias dentro de cada ilha (as ilhas se ligam pelo barco, sem rota no mapa).
    {
      path: [
        [745, 255],
        [805, 215],
        [805, 80],
      ],
    },
    {
      path: [
        [745, 255],
        [750, 330],
      ],
    },
    {
      path: [
        [600, 210],
        [600, 110],
      ],
    },
    {
      path: [
        [720, 450],
        [720, 510],
      ],
    },
    {
      path: [
        [720, 450],
        [560, 450],
      ],
    },
    {
      path: [
        [380, 190],
        [360, 100],
      ],
    },
    {
      path: [
        [330, 420],
        [390, 360],
      ],
    },
    {
      path: [
        [390, 360],
        [470, 420],
      ],
      kind: 'water',
    },
    {
      path: [
        [330, 420],
        [290, 330],
      ],
      kind: 'water',
    },
    {
      path: [
        [330, 420],
        [180, 420],
      ],
      kind: 'water',
    },
    {
      path: [
        [180, 420],
        [160, 480],
      ],
    },
    {
      path: [
        [680, 640],
        [760, 600],
        [820, 530],
      ],
      kind: 'water',
    },
    {
      path: [
        [680, 640],
        [560, 640],
      ],
    },
    {
      path: [
        [600, 640],
        [600, 590],
      ],
    },
    {
      path: [
        [560, 640],
        [500, 650],
      ],
      kind: 'water',
    },
    {
      path: [
        [500, 650],
        [480, 600],
      ],
    },
    {
      path: [
        [260, 520],
        [260, 575],
        [260, 635],
        [220, 690],
        [260, 740],
      ],
    },
    {
      path: [
        [260, 740],
        [690, 740],
      ],
      kind: 'water',
    },
  ],
  places: [
    { location: 'one-island', kind: 'town', at: [745, 255], label: 'w' },
    { location: 'kindle-road', kind: 'field', at: [805, 170], label: 'e' },
    { location: 'mt-ember', kind: 'mountain', at: [805, 80], label: 'e' },
    { location: 'treasure-beach', kind: 'island', at: [750, 330], label: 'w' },
    { location: 'two-island', kind: 'town', at: [600, 210], label: 's' },
    { location: 'cape-brink', kind: 'field', at: [600, 110], label: 'n' },
    { location: 'three-island', kind: 'town', at: [720, 450], label: 'e' },
    { location: 'three-isle-port', kind: 'building', at: [720, 510], label: 'e' },
    { location: 'bond-bridge', kind: 'water', at: [640, 450], label: 'n' },
    { location: 'berry-forest', kind: 'forest', at: [560, 450], label: 'n' },
    { location: 'four-island', kind: 'town', at: [380, 190], label: 's' },
    { location: 'icefall-cave', kind: 'cave', at: [360, 100], label: 'e' },
    { location: 'five-island', kind: 'town', at: [330, 420], label: 's' },
    { location: 'five-isle-meadow', kind: 'field', at: [390, 360], label: 'n' },
    { location: 'memorial-pillar', kind: 'ruins', at: [470, 420], label: 's' },
    { location: 'water-labyrinth', kind: 'water', at: [290, 330], label: 'n' },
    { location: 'resort-gorgeous', kind: 'island', at: [180, 420], label: 'n' },
    { location: 'lost-cave', kind: 'cave', at: [160, 480], label: 's' },
    { location: 'six-island', kind: 'town', at: [680, 640], label: 's' },
    { location: 'water-path', kind: 'water', at: [760, 600], label: 'e' },
    { location: 'ruin-valley', kind: 'ruins', at: [820, 530], label: 'e' },
    { location: 'green-path', kind: 'field', at: [600, 640], label: 's' },
    { location: 'pattern-bush', kind: 'forest', at: [600, 590], label: 'n' },
    { location: 'outcast-island', kind: 'island', at: [500, 650], label: 's' },
    { location: 'kanto-altering-cave', kind: 'cave', at: [480, 600], label: 'w' },
    { location: 'trainer-tower', kind: 'tower', at: [260, 520], label: 'e' },
    { location: 'seven-island', kind: 'town', at: [260, 575], label: 'e' },
    { location: 'canyon-entrance', kind: 'field', at: [260, 635], label: 'e' },
    { location: 'sevault-canyon', kind: 'mountain', at: [220, 690], label: 'w' },
    { location: 'tanoby-ruins', kind: 'ruins', at: [260, 740], label: 'w' },
    ...TANOBY_CHAMBERS,
    { location: 'navel-rock', kind: 'special', at: [83, 91], label: 'e' },
    { location: 'birth-island', kind: 'special', at: [83, 201], label: 'e' },
  ],
}
