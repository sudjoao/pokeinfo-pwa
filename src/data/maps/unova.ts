import type { RegionMap } from './types'

const BW = ['black-white']
const B2W2 = ['black-2-white-2']

/**
 * Unova (Black/White e Black 2/White 2). O anel da história sai de Nuvema, no sudeste, sobe por
 * Striaton e Nacrene, atravessa a Skyarrow Bridge até Castelia, no sul, e segue para o norte por
 * Nimbasa, Driftveil, Mistralton e Icirrus até Opelucid e a Victory Road. A costa leste (Rotas
 * 11–14, Undella) fecha o anel. O sudoeste (Aspertia, Floccesy, Virbank) e o extremo leste
 * (Humilau, Reversal Mountain, Lentimas) só existem em Black 2/White 2.
 */
export const UNOVA_MAP: RegionMap = {
  width: 1120,
  height: 920,
  areas: [
    {
      kind: 'land',
      points: [
        [-30, -30],
        [1150, -30],
        [1150, 300],
        [1108, 420],
        [1090, 520],
        [1112, 640],
        [1080, 720],
        [1030, 770],
        [1012, 850],
        [940, 880],
        [860, 820],
        [760, 790],
        [690, 770],
        [640, 772],
        [600, 800],
        [580, 860],
        [520, 870],
        [470, 840],
        [400, 850],
        [300, 846],
        [180, 846],
        [60, 852],
        [-30, 840],
      ],
    },
    // Ilhas da Rota 18 e do Liberty Garden.
    {
      kind: 'land',
      points: [
        [1036, 820],
        [1086, 812],
        [1100, 860],
        [1070, 904],
        [1030, 884],
      ],
    },
    {
      kind: 'land',
      points: [
        [638, 838],
        [668, 828],
        [684, 856],
        [660, 876],
        [634, 862],
      ],
      only: BW,
    },
    // Undella Bay e o porto de Driftveil.
    {
      kind: 'water',
      points: [
        [952, 446],
        [1004, 440],
        [1018, 484],
        [992, 512],
        [950, 500],
      ],
    },
    {
      kind: 'water',
      points: [
        [-30, 470],
        [80, 462],
        [130, 500],
        [110, 556],
        [-30, 572],
      ],
    },
    // Neve do norte, serras (Twist Mountain, Chargestone, Victory Road, Reversal Mountain).
    {
      kind: 'snow',
      points: [
        [330, 20],
        [470, 20],
        [500, 120],
        [430, 190],
        [340, 170],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [240, 120],
        [320, 116],
        [340, 190],
        [290, 210],
        [236, 180],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [200, 290],
        [266, 284],
        [280, 340],
        [228, 360],
        [196, 330],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [540, 80],
        [690, 76],
        [700, 170],
        [610, 176],
        [536, 136],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [944, 576],
        [1010, 570],
        [1024, 620],
        [980, 640],
        [940, 616],
      ],
      only: B2W2,
    },
    {
      kind: 'sand',
      points: [
        [340, 560],
        [480, 552],
        [500, 630],
        [420, 664],
        [340, 640],
      ],
    },
    {
      kind: 'forest',
      points: [
        [600, 696],
        [676, 690],
        [690, 740],
        [640, 760],
        [596, 740],
      ],
    },
    {
      kind: 'forest',
      points: [
        [534, 344],
        [604, 338],
        [612, 384],
        [570, 400],
        [530, 386],
      ],
    },
  ],
  routes: [
    // Começo (Nuvema → Castelia).
    {
      location: 'unova-route-1',
      path: [
        [980, 830],
        [980, 730],
      ],
      badge: [980, 800],
    },
    {
      location: 'unova-route-2',
      path: [
        [980, 730],
        [980, 690],
        [870, 690],
      ],
      badge: [935, 690],
    },
    {
      location: 'unova-route-3',
      path: [
        [870, 690],
        [720, 690],
      ],
      badge: [800, 690],
    },
    {
      path: [
        [870, 690],
        [870, 635],
      ],
    },
    {
      path: [
        [800, 690],
        [800, 735],
      ],
    },
    {
      path: [
        [720, 690],
        [640, 720],
      ],
    },
    {
      path: [
        [640, 720],
        [600, 760],
        [540, 790],
      ],
    },
    {
      location: 'unova-route-4',
      path: [
        [540, 790],
        [540, 560],
        [470, 430],
      ],
      badge: [540, 650],
    },
    {
      path: [
        [540, 600],
        [450, 600],
      ],
    },
    {
      path: [
        [450, 600],
        [380, 620],
      ],
    },
    // Centro e oeste (Nimbasa → Driftveil → Mistralton).
    {
      location: 'unova-route-16',
      path: [
        [470, 430],
        [570, 430],
      ],
      badge: [520, 430],
    },
    {
      path: [
        [570, 430],
        [570, 380],
      ],
    },
    {
      location: 'marvelous-bridge',
      path: [
        [570, 430],
        [690, 410],
      ],
    },
    {
      location: 'unova-route-15',
      path: [
        [690, 410],
        [800, 400],
      ],
      badge: [745, 405],
    },
    {
      location: 'unova-route-5',
      path: [
        [470, 430],
        [340, 430],
      ],
      badge: [405, 430],
    },
    {
      location: 'driftveil-drawbridge',
      path: [
        [340, 430],
        [190, 450],
      ],
    },
    {
      path: [
        [190, 450],
        [190, 520],
      ],
      only: BW,
    },
    {
      location: 'unova-route-6',
      path: [
        [190, 450],
        [190, 360],
        [240, 320],
      ],
      badge: [190, 400],
    },
    {
      path: [
        [240, 320],
        [140, 250],
      ],
      kind: 'cave',
    },
    {
      path: [
        [190, 375],
        [110, 375],
      ],
    },
    {
      path: [
        [110, 375],
        [60, 410],
      ],
      kind: 'cave',
    },
    // Norte (Mistralton → Icirrus → Opelucid).
    {
      location: 'unova-route-7',
      path: [
        [140, 250],
        [140, 160],
        [290, 160],
      ],
      badge: [140, 205],
    },
    {
      path: [
        [200, 160],
        [200, 110],
      ],
    },
    {
      path: [
        [290, 160],
        [400, 140],
      ],
      kind: 'cave',
    },
    {
      path: [
        [400, 140],
        [400, 70],
      ],
    },
    {
      location: 'unova-route-8',
      path: [
        [400, 140],
        [440, 180],
        [540, 180],
      ],
      badge: [490, 180],
    },
    {
      path: [
        [450, 184],
        [450, 240],
      ],
    },
    {
      path: [
        [540, 180],
        [600, 180],
      ],
    },
    {
      location: 'unova-route-9',
      path: [
        [600, 180],
        [720, 180],
      ],
      badge: [670, 180],
    },
    {
      path: [
        [640, 180],
        [640, 230],
      ],
      only: BW,
    },
    // Liga: Rota 10 em Black/White, Rota 23 em Black 2/White 2.
    {
      location: 'unova-route-10',
      path: [
        [720, 180],
        [720, 110],
        [600, 110],
      ],
      badge: [720, 140],
      only: BW,
    },
    {
      location: 'unova-route-23',
      path: [
        [1060, 180],
        [1060, 60],
        [700, 60],
        [600, 110],
      ],
      badge: [880, 60],
      only: B2W2,
    },
    {
      path: [
        [600, 110],
        [530, 70],
      ],
    },
    {
      path: [
        [530, 70],
        [560, 30],
      ],
      only: BW,
    },
    {
      path: [
        [600, 110],
        [650, 80],
      ],
      kind: 'cave',
      only: BW,
    },
    {
      path: [
        [600, 110],
        [640, 150],
      ],
      kind: 'cave',
      only: B2W2,
    },
    // Leste (Opelucid → Lacunosa → Undella → Black City).
    {
      location: 'unova-route-11',
      path: [
        [720, 180],
        [840, 180],
      ],
      badge: [780, 180],
    },
    {
      location: 'unova-route-12',
      path: [
        [840, 180],
        [940, 210],
      ],
      badge: [890, 195],
    },
    {
      location: 'unova-route-13',
      path: [
        [940, 210],
        [960, 300],
        [940, 420],
        [900, 470],
      ],
      badge: [956, 340],
    },
    {
      path: [
        [940, 210],
        [1000, 140],
      ],
    },
    {
      location: 'unova-route-14',
      path: [
        [900, 470],
        [850, 470],
        [850, 400],
        [800, 400],
      ],
      badge: [850, 440],
    },
    {
      path: [
        [850, 400],
        [850, 345],
      ],
    },
    {
      path: [
        [900, 470],
        [980, 476],
      ],
      kind: 'water',
    },
    // Black 2/White 2: Humilau, Seaside Cave, Reversal Mountain e Lentimas.
    {
      path: [
        [980, 476],
        [1040, 480],
      ],
      kind: 'water',
      only: B2W2,
    },
    {
      location: 'unova-route-21',
      path: [
        [1040, 480],
        [1060, 440],
        [1060, 380],
      ],
      kind: 'water',
      badge: [1060, 425],
      only: B2W2,
    },
    {
      location: 'unova-route-22',
      path: [
        [1060, 380],
        [1060, 180],
        [1000, 140],
      ],
      badge: [1060, 280],
      only: B2W2,
    },
    {
      path: [
        [900, 470],
        [900, 560],
      ],
      only: B2W2,
    },
    {
      path: [
        [900, 560],
        [980, 600],
      ],
      only: B2W2,
    },
    {
      path: [
        [980, 600],
        [1060, 620],
      ],
      kind: 'cave',
      only: B2W2,
    },
    // Rotas 17 e 18 (mar a leste de Nuvema).
    {
      location: 'unova-route-17',
      path: [
        [980, 770],
        [1066, 770],
        [1066, 830],
      ],
      kind: 'water',
      badge: [1040, 770],
    },
    {
      location: 'unova-route-18',
      path: [
        [1066, 830],
        [1066, 872],
      ],
      badge: [1066, 850],
    },
    {
      path: [
        [1066, 872],
        [1040, 846],
      ],
      only: B2W2,
    },
    // Liberty Garden (evento de Black/White, de barco a partir de Castelia).
    {
      path: [
        [540, 790],
        [656, 852],
      ],
      kind: 'water',
      only: BW,
    },
    // Sudoeste de Black 2/White 2 e a passagem por baixo de Castelia.
    {
      location: 'unova-route-19',
      path: [
        [90, 790],
        [90, 700],
        [180, 680],
      ],
      badge: [90, 740],
      only: B2W2,
    },
    {
      location: 'unova-route-20',
      path: [
        [180, 680],
        [270, 710],
        [300, 790],
      ],
      badge: [262, 708],
      only: B2W2,
    },
    {
      path: [
        [180, 680],
        [180, 620],
      ],
      only: B2W2,
    },
    {
      path: [
        [300, 790],
        [360, 740],
      ],
      only: B2W2,
    },
    {
      path: [
        [300, 790],
        [330, 876],
        [560, 876],
        [556, 806],
      ],
      kind: 'water',
      only: B2W2,
    },
    {
      path: [
        [540, 790],
        [500, 830],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [500, 830],
        [420, 730],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [420, 730],
        [380, 620],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [420, 730],
        [290, 620],
        [220, 470],
      ],
      kind: 'cave',
      only: B2W2,
    },
    // Clay Tunnel e as salas das Underground Ruins (Black 2/White 2).
    {
      path: [
        [190, 430],
        [280, 390],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [280, 390],
        [300, 260],
        [290, 160],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [280, 390],
        [350, 355],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [350, 355],
        [360, 300],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [350, 355],
        [405, 330],
      ],
      kind: 'cave',
      only: B2W2,
    },
    {
      path: [
        [350, 355],
        [405, 378],
      ],
      kind: 'cave',
      only: B2W2,
    },
  ],
  places: [
    { location: 'nuvema-town', kind: 'town', at: [980, 830], label: 'w' },
    { location: 'accumula-town', kind: 'town', at: [980, 730], label: 'e' },
    { location: 'striaton-city', kind: 'city', at: [870, 690], label: 's' },
    { location: 'dreamyard', kind: 'building', at: [870, 635], label: 'n' },
    { location: 'wellspring-cave', kind: 'cave', at: [800, 735], label: 's' },
    { location: 'nacrene-city', kind: 'city', at: [720, 690], label: 's' },
    { location: 'pinwheel-forest', kind: 'forest', at: [640, 720], label: 'n' },
    { location: 'castelia-city', kind: 'city', at: [540, 790], label: 'e' },
    { location: 'desert-resort', kind: 'field', at: [450, 600], label: 's' },
    { location: 'relic-castle', kind: 'ruins', at: [380, 620], label: 'w' },
    { location: 'nimbasa-city', kind: 'city', at: [470, 430], label: 'n' },
    { location: 'lostlorn-forest', kind: 'forest', at: [570, 375], label: 'n' },
    { location: 'black-city-white-forest', kind: 'town', at: [800, 400], label: 'n', only: BW },
    {
      location: 'black-tower-white-treehollow',
      kind: 'tower',
      at: [800, 400],
      label: 'n',
      only: B2W2,
    },
    { location: 'driftveil-city', kind: 'city', at: [190, 450], label: 'w' },
    { location: 'cold-storage', kind: 'building', at: [190, 520], label: 'e', only: BW },
    { location: 'chargestone-cave', kind: 'cave', at: [240, 320], label: 'e' },
    { location: 'mistralton-cave', kind: 'cave', at: [110, 375], label: 's' },
    { location: 'guidance-chamber', kind: 'cave', at: [60, 410], label: 's' },
    { location: 'mistralton-city', kind: 'city', at: [140, 250], label: 'w' },
    { location: 'celestial-tower', kind: 'tower', at: [200, 110], label: 'n' },
    { location: 'twist-mountain', kind: 'cave', at: [290, 160], label: 'n' },
    { location: 'icirrus-city', kind: 'city', at: [400, 140], label: 'e' },
    { location: 'dragonspiral-tower', kind: 'tower', at: [400, 70], label: 'w' },
    { location: 'moor-of-icirrus', kind: 'water', at: [450, 240], label: 's' },
    { location: 'opelucid-city', kind: 'city', at: [720, 180], label: 's' },
    { location: 'challengers-cave', kind: 'cave', at: [640, 230], label: 's', only: BW },
    { location: 'unova-victory-road', kind: 'cave', at: [600, 110], label: 'sw' },
    { location: 'unova-pokemon-league', kind: 'building', at: [530, 70], label: 'w' },
    { location: 'ns-castle', kind: 'special', at: [560, 30], label: 'e', only: BW },
    { location: 'trial-chamber', kind: 'cave', at: [650, 80], label: 'e', only: BW },
    { location: 'unova-victory-road-2', kind: 'cave', at: [640, 150], label: 'e', only: B2W2 },
    { location: 'village-bridge', kind: 'town', at: [840, 180], label: 'n' },
    { location: 'lacunosa-town', kind: 'town', at: [940, 210], label: 'sw' },
    { location: 'giant-chasm', kind: 'cave', at: [1000, 140], label: 'n' },
    { location: 'abundant-shrine', kind: 'ruins', at: [850, 345], label: 'n' },
    { location: 'undella-town', kind: 'town', at: [900, 470], label: 'sw' },
    { location: 'undella-bay', kind: 'water', at: [980, 476], label: 'n' },
    { location: 'seaside-cave', kind: 'cave', at: [1040, 480], label: 's', only: B2W2 },
    { location: 'humilau-city', kind: 'city', at: [1060, 380], label: 'w', only: B2W2 },
    { location: 'strange-house', kind: 'building', at: [900, 560], label: 'w', only: B2W2 },
    { location: 'reversal-mountain', kind: 'cave', at: [980, 600], label: 's', only: B2W2 },
    { location: 'lentimas-town', kind: 'town', at: [1060, 620], label: 's', only: B2W2 },
    { location: 'p2-laboratory', kind: 'building', at: [1066, 872], label: 's' },
    { location: 'nature-sanctuary', kind: 'field', at: [1040, 846], label: 'w', only: B2W2 },
    { location: 'liberty-garden', kind: 'island', at: [656, 852], label: 'e', only: BW },
    { location: 'aspertia-city', kind: 'city', at: [90, 790], label: 'e', only: B2W2 },
    { location: 'floccesy-town', kind: 'town', at: [180, 680], label: 'e', only: B2W2 },
    { location: 'floccesy-ranch', kind: 'field', at: [180, 620], label: 'n', only: B2W2 },
    { location: 'virbank-city', kind: 'city', at: [300, 790], label: 'w', only: B2W2 },
    { location: 'virbank-complex', kind: 'building', at: [360, 740], label: 'e', only: B2W2 },
    { location: 'castelia-sewers', kind: 'cave', at: [500, 830], label: 's', only: B2W2 },
    { location: 'relic-passage', kind: 'cave', at: [420, 730], label: 'e', only: B2W2 },
    { location: 'clay-tunnel', kind: 'cave', at: [280, 390], label: 's', only: B2W2 },
    { location: 'underground-ruins', kind: 'ruins', at: [350, 355], label: 'sw', only: B2W2 },
    { location: 'iron-room', kind: 'ruins', at: [360, 300], label: 'n', only: B2W2 },
    { location: 'rocky-mountain-room', kind: 'ruins', at: [405, 330], label: 'e', only: B2W2 },
    { location: 'glacier-room', kind: 'ruins', at: [405, 378], label: 'e', only: B2W2 },
  ],
}
