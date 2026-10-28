import type { RegionMap } from './types'

/**
 * Sinnoh (Diamond/Pearl, Platinum e Brilliant Diamond/Shining Pearl). O Mt. Coronet corta a região
 * de norte a sul: a oeste ficam Twinleaf, Jubilife, Oreburgh, Floaroma e Eterna; a leste,
 * Hearthome, Solaceon, Veilstone, Pastoria e Sunyshore. Snowpoint e o Lake Acuity ficam no norte
 * nevado, Canalave e as ilhas no oeste, a Liga numa ilha a leste e a Battle Zone (Rotas 225–230 e
 * Stark Mountain) numa ilha própria no nordeste.
 */
export const SINNOH_MAP: RegionMap = {
  width: 1240,
  height: 960,
  areas: [
    // Continente.
    {
      kind: 'land',
      points: [
        [290, 12],
        [790, 12],
        [812, 120],
        [845, 250],
        [935, 312],
        [1050, 325],
        [1108, 362],
        [1118, 460],
        [1120, 560],
        [1185, 582],
        [1210, 640],
        [1172, 690],
        [1100, 745],
        [1000, 785],
        [920, 815],
        [850, 838],
        [760, 832],
        [660, 805],
        [560, 785],
        [470, 805],
        [420, 845],
        [400, 870],
        [330, 874],
        [260, 874],
        [200, 862],
        [130, 822],
        [108, 740],
        [118, 680],
        [110, 620],
        [130, 560],
        [188, 480],
        [198, 400],
        [238, 290],
        [276, 180],
        [268, 80],
      ],
    },
    // Península da Rota 221, a Iron Island e a Newmoon Island.
    {
      kind: 'land',
      points: [
        [482, 882],
        [560, 870],
        [688, 880],
        [700, 924],
        [600, 942],
        [492, 934],
      ],
    },
    {
      kind: 'land',
      points: [
        [26, 536],
        [90, 528],
        [102, 580],
        [56, 602],
        [20, 586],
      ],
    },
    {
      kind: 'land',
      points: [
        [30, 720],
        [90, 714],
        [96, 760],
        [52, 776],
        [24, 760],
      ],
    },
    // Ilha da Liga (Victory Road, Rota 224 e Flower Paradise).
    {
      kind: 'land',
      points: [
        [1146, 298],
        [1214, 268],
        [1234, 330],
        [1230, 420],
        [1200, 476],
        [1150, 470],
        [1140, 400],
      ],
    },
    // Battle Zone.
    {
      kind: 'land',
      points: [
        [870, 40],
        [940, 8],
        [1100, 6],
        [1215, 18],
        [1232, 90],
        [1180, 170],
        [1110, 232],
        [1000, 238],
        [900, 238],
        [864, 168],
      ],
    },
    // Baía da Rota 226, no norte da Battle Zone.
    {
      kind: 'water',
      points: [
        [944, 26],
        [1050, 22],
        [1062, 56],
        [1000, 64],
        [944, 58],
      ],
    },
    // Norte nevado (Snowpoint, Lake Acuity, Rotas 216 e 217).
    {
      kind: 'snow',
      points: [
        [292, 14],
        [788, 14],
        [796, 120],
        [700, 212],
        [560, 214],
        [420, 196],
        [300, 172],
      ],
    },
    // Mt. Coronet, de norte a sul.
    {
      kind: 'mountain',
      points: [
        [632, 150],
        [702, 140],
        [722, 300],
        [712, 450],
        [704, 640],
        [640, 652],
        [618, 560],
        [626, 350],
      ],
    },
    // Stark Mountain (vulcão) e o deserto da Rota 228.
    {
      kind: 'lava',
      points: [
        [1110, 30],
        [1170, 22],
        [1196, 56],
        [1160, 82],
        [1112, 70],
      ],
    },
    {
      kind: 'sand',
      points: [
        [1046, 120],
        [1096, 116],
        [1110, 168],
        [1072, 192],
        [1040, 160],
      ],
    },
    // Eterna Forest.
    {
      kind: 'forest',
      points: [
        [420, 362],
        [500, 356],
        [512, 420],
        [462, 446],
        [414, 426],
      ],
    },
    // Os três lagos.
    {
      kind: 'water',
      points: [
        [150, 766],
        [194, 762],
        [204, 792],
        [170, 806],
        [146, 792],
      ],
    },
    {
      kind: 'water',
      points: [
        [1034, 646],
        [1086, 640],
        [1098, 676],
        [1058, 694],
        [1030, 680],
      ],
    },
    {
      kind: 'water',
      points: [
        [424, 116],
        [474, 112],
        [482, 140],
        [448, 154],
        [420, 140],
      ],
    },
  ],
  routes: [
    // Oeste do Mt. Coronet.
    {
      location: 'sinnoh-route-201',
      path: [
        [250, 830],
        [250, 780],
        [370, 780],
      ],
      badge: [312, 780],
    },
    {
      location: 'sinnoh-route-202',
      path: [
        [370, 780],
        [370, 640],
      ],
      badge: [370, 712],
    },
    {
      location: 'sinnoh-route-219',
      path: [
        [370, 780],
        [370, 862],
      ],
      badge: [370, 832],
    },
    {
      location: 'sinnoh-sea-route-220',
      path: [
        [370, 862],
        [520, 905],
      ],
      kind: 'water',
      badge: [446, 884],
    },
    {
      location: 'sinnoh-route-221',
      path: [
        [520, 905],
        [660, 905],
      ],
      badge: [590, 905],
    },
    {
      location: 'sinnoh-route-218',
      path: [
        [370, 640],
        [150, 640],
      ],
      kind: 'water',
      badge: [262, 640],
    },
    {
      location: 'sinnoh-route-203',
      path: [
        [370, 640],
        [490, 640],
      ],
      badge: [430, 640],
    },
    {
      location: 'sinnoh-route-204',
      path: [
        [370, 640],
        [370, 470],
      ],
      badge: [370, 592],
    },
    {
      location: 'sinnoh-route-205',
      path: [
        [370, 470],
        [460, 470],
        [460, 330],
        [560, 330],
      ],
      badge: [460, 445],
    },
    {
      location: 'sinnoh-route-206',
      path: [
        [560, 330],
        [580, 360],
        [580, 580],
        [600, 600],
      ],
      badge: [580, 450],
    },
    {
      location: 'sinnoh-route-207',
      path: [
        [560, 640],
        [600, 600],
        [660, 600],
      ],
      badge: [628, 600],
    },
    {
      location: 'sinnoh-route-211',
      path: [
        [560, 330],
        [760, 330],
      ],
      badge: [605, 330],
    },
    // Norte: do Mt. Coronet até Snowpoint.
    {
      location: 'sinnoh-route-216',
      path: [
        [670, 170],
        [530, 170],
      ],
      badge: [600, 170],
    },
    {
      location: 'sinnoh-route-217',
      path: [
        [530, 170],
        [530, 95],
      ],
      badge: [530, 136],
    },
    // Leste do Mt. Coronet.
    {
      location: 'sinnoh-route-208',
      path: [
        [660, 600],
        [790, 600],
      ],
      badge: [725, 600],
    },
    {
      location: 'sinnoh-route-209',
      path: [
        [790, 600],
        [880, 600],
        [880, 480],
      ],
      badge: [835, 600],
    },
    {
      location: 'sinnoh-route-210',
      path: [
        [880, 480],
        [880, 330],
        [760, 330],
      ],
      badge: [880, 430],
    },
    {
      location: 'sinnoh-route-215',
      path: [
        [880, 380],
        [1000, 380],
      ],
      badge: [940, 380],
    },
    {
      location: 'sinnoh-route-214',
      path: [
        [1000, 380],
        [1000, 610],
      ],
      badge: [1000, 515],
    },
    {
      location: 'sinnoh-route-212',
      path: [
        [790, 600],
        [790, 720],
        [870, 720],
      ],
      badge: [790, 628],
    },
    {
      location: 'sinnoh-route-213',
      path: [
        [1000, 610],
        [1000, 720],
        [870, 720],
      ],
      badge: [940, 720],
    },
    {
      location: 'sinnoh-route-222',
      path: [
        [1000, 610],
        [1160, 610],
      ],
      badge: [1080, 610],
    },
    {
      location: 'sinnoh-sea-route-223',
      path: [
        [1160, 610],
        [1160, 440],
      ],
      kind: 'water',
      badge: [1160, 525],
    },
    {
      location: 'sinnoh-route-224',
      path: [
        [1160, 370],
        [1160, 305],
      ],
      badge: [1160, 336],
    },
    // Battle Zone.
    {
      location: 'sinnoh-route-225',
      path: [
        [920, 210],
        [930, 90],
      ],
      badge: [925, 152],
    },
    {
      location: 'sinnoh-sea-route-226',
      path: [
        [930, 90],
        [960, 44],
        [1040, 44],
        [1060, 92],
      ],
      kind: 'water',
      badge: [1000, 44],
    },
    {
      location: 'sinnoh-route-227',
      path: [
        [1060, 92],
        [1095, 62],
        [1140, 46],
      ],
      badge: [1096, 62],
    },
    {
      location: 'sinnoh-route-228',
      path: [
        [1060, 92],
        [1080, 166],
      ],
      badge: [1070, 130],
    },
    {
      location: 'sinnoh-route-229',
      path: [
        [1080, 166],
        [1080, 206],
        [1020, 210],
      ],
      badge: [1078, 198],
    },
    {
      location: 'sinnoh-sea-route-230',
      path: [
        [1020, 210],
        [1000, 252],
        [940, 252],
        [920, 210],
      ],
      kind: 'water',
      badge: [970, 252],
    },
    // Ligações sem placa: trilhas, portões, barcos e passagens dentro do Mt. Coronet.
    {
      path: [
        [250, 780],
        [175, 780],
      ],
    },
    {
      path: [
        [490, 640],
        [560, 640],
      ],
    },
    {
      path: [
        [560, 640],
        [560, 710],
      ],
    },
    {
      path: [
        [150, 640],
        [60, 560],
      ],
      kind: 'water',
    },
    {
      path: [
        [150, 640],
        [60, 745],
      ],
      kind: 'water',
    },
    {
      path: [
        [370, 470],
        [310, 440],
      ],
    },
    {
      path: [
        [460, 470],
        [500, 490],
      ],
    },
    {
      path: [
        [420, 470],
        [420, 506],
        [240, 520],
      ],
      kind: 'water',
    },
    {
      path: [
        [460, 395],
        [410, 350],
      ],
    },
    {
      path: [
        [580, 500],
        [612, 500],
      ],
    },
    {
      path: [
        [670, 330],
        [670, 170],
      ],
      kind: 'cave',
    },
    {
      path: [
        [530, 95],
        [440, 55],
      ],
    },
    {
      path: [
        [530, 95],
        [450, 132],
      ],
    },
    {
      path: [
        [440, 55],
        [360, 45],
      ],
    },
    {
      path: [
        [880, 560],
        [930, 560],
      ],
    },
    {
      path: [
        [880, 480],
        [930, 470],
      ],
    },
    {
      path: [
        [790, 650],
        [740, 650],
      ],
    },
    {
      path: [
        [870, 720],
        [870, 790],
      ],
    },
    {
      path: [
        [1000, 440],
        [1045, 440],
      ],
    },
    {
      path: [
        [1000, 480],
        [1045, 480],
      ],
    },
    {
      path: [
        [1000, 545],
        [1050, 545],
      ],
    },
    {
      path: [
        [1050, 545],
        [1095, 545],
      ],
      kind: 'cave',
    },
    {
      path: [
        [1000, 650],
        [1062, 668],
      ],
    },
    {
      path: [
        [1160, 440],
        [1160, 370],
      ],
    },
    {
      path: [
        [1160, 305],
        [1200, 296],
      ],
    },
  ],
  places: [
    { location: 'twinleaf-town', kind: 'town', at: [250, 830], label: 's' },
    { location: 'lake-verity', kind: 'water', at: [175, 780], label: 'n' },
    { location: 'sandgem-town', kind: 'town', at: [370, 780], label: 'e' },
    { location: 'jubilife-city', kind: 'city', at: [370, 640], label: 'nw' },
    { location: 'canalave-city', kind: 'city', at: [150, 640], label: 'n' },
    { location: 'iron-island', kind: 'island', at: [60, 560], label: 's' },
    { location: 'newmoon-island', kind: 'island', at: [60, 745], label: 's' },
    { location: 'oreburgh-gate', kind: 'cave', at: [490, 640], label: 'n' },
    { location: 'oreburgh-city', kind: 'city', at: [560, 640], label: 'e' },
    { location: 'oreburgh-mine', kind: 'cave', at: [560, 710], label: 's' },
    { location: 'ravaged-path', kind: 'cave', at: [370, 540], label: 'e' },
    { location: 'floaroma-town', kind: 'town', at: [370, 470], label: 'n' },
    { location: 'floaroma-meadow', kind: 'field', at: [310, 440], label: 'w' },
    { location: 'valley-windworks', kind: 'building', at: [500, 490], label: 's' },
    { location: 'fuego-ironworks', kind: 'building', at: [240, 520], label: 's' },
    { location: 'eterna-forest', kind: 'forest', at: [460, 395], label: 'e' },
    { location: 'old-chateau', kind: 'building', at: [410, 350], label: 'n' },
    { location: 'eterna-city', kind: 'city', at: [560, 330], label: 'n' },
    { location: 'wayward-cave', kind: 'cave', at: [612, 500], label: 'e' },
    { location: 'mt-coronet', kind: 'cave', at: [660, 600], label: 's' },
    { location: 'spear-pillar', kind: 'special', at: [670, 240], label: 'e' },
    { location: 'acuity-lakefront', kind: 'field', at: [530, 95], label: 'e' },
    { location: 'lake-acuity', kind: 'water', at: [450, 132], label: 's' },
    { location: 'snowpoint-city', kind: 'city', at: [440, 55], label: 'e' },
    { location: 'snowpoint-temple', kind: 'ruins', at: [360, 45], label: 's' },
    { location: 'celestic-town', kind: 'town', at: [760, 330], label: 'n' },
    { location: 'hearthome-city', kind: 'city', at: [790, 600], label: 'n' },
    { location: 'trophy-garden', kind: 'field', at: [740, 650], label: 's' },
    { location: 'lost-tower', kind: 'tower', at: [930, 560], label: 'e' },
    { location: 'solaceon-town', kind: 'town', at: [880, 480], label: 'w' },
    { location: 'solaceon-ruins', kind: 'ruins', at: [930, 470], label: 'e' },
    { location: 'veilstone-city', kind: 'city', at: [1000, 380], label: 'ne' },
    { location: 'ruin-maniac-cave', kind: 'cave', at: [1045, 440], label: 'e' },
    { location: 'maniac-tunnel', kind: 'cave', at: [1045, 480], label: 'e' },
    { location: 'sendoff-spring', kind: 'water', at: [1050, 545], label: 'n' },
    { location: 'turnback-cave', kind: 'cave', at: [1095, 545], label: 's' },
    { location: 'valor-lakefront', kind: 'field', at: [1000, 610], label: 'sw' },
    { location: 'lake-valor', kind: 'water', at: [1062, 668], label: 's' },
    { location: 'pastoria-city', kind: 'city', at: [870, 720], label: 'n' },
    { location: 'great-marsh', kind: 'field', at: [870, 790], label: 's' },
    { location: 'sunyshore-city', kind: 'city', at: [1160, 610], label: 's' },
    { location: 'sinnoh-victory-road', kind: 'cave', at: [1160, 440], label: 's' },
    { location: 'sinnoh-pokemon-league', kind: 'building', at: [1160, 370], label: 'w' },
    { location: 'flower-paradise', kind: 'field', at: [1200, 296], label: 'n' },
    { location: 'fight-area', kind: 'town', at: [920, 210], label: 'w' },
    { location: 'survival-area', kind: 'town', at: [930, 90], label: 'w' },
    { location: 'resort-area', kind: 'town', at: [1020, 210], label: 'n' },
    { location: 'stark-mountain', kind: 'mountain', at: [1140, 46], label: 's' },
  ],
  // O Distortion World (Platinum) é outra dimensão, sem lugar no mapa.
  offMap: ['distortion-world'],
}
