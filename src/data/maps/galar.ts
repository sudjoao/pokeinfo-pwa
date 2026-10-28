import type { RegionMap } from './types'

/**
 * Galar (Sword/Shield). País comprido de sul a norte: Postwick e Wedgehurst no sul, a Wild Area no
 * meio (a parte sul dentro da volta Motostoke–Turffield–Hulbury, a parte norte subindo até
 * Hammerlocke), Stow-on-Side e Ballonlea a oeste, Circhester e Spikemuth no norte e a Rota 10 na
 * neve até Wyndon, no extremo norte.
 */
export const GALAR_MAP: RegionMap = {
  width: 960,
  height: 1700,
  areas: [
    {
      kind: 'land',
      points: [
        [60, -30],
        [900, -30],
        [930, 300],
        [905, 520],
        [935, 900],
        [945, 1250],
        [925, 1500],
        [890, 1690],
        [520, 1720],
        [120, 1690],
        [40, 1400],
        [70, 1100],
        [20, 880],
        [40, 560],
        [70, 250],
      ],
    },
    // Neve da Rota 10 e de Circhester.
    {
      kind: 'snow',
      points: [
        [330, 20],
        [720, 20],
        [730, 290],
        [600, 315],
        [420, 312],
        [290, 380],
        [250, 280],
      ],
    },
    // Baía de Circhester (Rota 9).
    {
      kind: 'water',
      points: [
        [560, 370],
        [760, 360],
        [790, 405],
        [700, 432],
        [590, 418],
      ],
    },
    // Deserto da Rota 6 e Stow-on-Side.
    {
      kind: 'sand',
      points: [
        [230, 660],
        [480, 655],
        [500, 735],
        [300, 752],
        [215, 720],
      ],
    },
    // Glimwood Tangle (Ballonlea fica dentro da floresta).
    {
      kind: 'forest',
      points: [
        [70, 740],
        [215, 735],
        [230, 830],
        [160, 910],
        [50, 900],
      ],
    },
    // Wild Area, parte norte: Giant's Cap e Dusty Bowl.
    {
      kind: 'mountain',
      points: [
        [250, 800],
        [410, 790],
        [430, 860],
        [380, 975],
        [250, 950],
      ],
    },
    {
      kind: 'water',
      points: [
        [640, 725],
        [730, 720],
        [745, 770],
        [660, 782],
      ],
    },
    // Wild Area, parte sul: Lake Miloch e Lake Axewell.
    {
      kind: 'water',
      points: [
        [520, 1115],
        [640, 1100],
        [720, 1125],
        [690, 1170],
        [560, 1192],
      ],
    },
    {
      kind: 'water',
      points: [
        [395, 1225],
        [520, 1215],
        [650, 1230],
        [640, 1278],
        [500, 1290],
        [390, 1265],
      ],
    },
    // Lago da Rota 2 e Slumbering Weald.
    {
      kind: 'water',
      points: [
        [300, 1510],
        [380, 1505],
        [395, 1570],
        [320, 1585],
      ],
    },
    {
      kind: 'forest',
      points: [
        [690, 1590],
        [870, 1585],
        [880, 1680],
        [700, 1690],
      ],
    },
  ],
  routes: [
    {
      location: 'galar-route-1',
      path: [
        [600, 1620],
        [600, 1470],
      ],
      badge: [600, 1545],
    },
    {
      location: 'galar-route-2',
      path: [
        [600, 1470],
        [440, 1470],
        [400, 1520],
      ],
      badge: [500, 1470],
    },
    {
      location: 'galar-route-3',
      path: [
        [760, 1040],
        [600, 1020],
        [440, 1020],
      ],
      badge: [620, 1022],
    },
    {
      location: 'galar-route-4',
      path: [
        [440, 1020],
        [160, 1060],
      ],
      badge: [300, 1040],
    },
    {
      location: 'galar-route-5',
      path: [
        [160, 1060],
        [160, 1380],
        [880, 1380],
        [880, 1300],
      ],
      badge: [360, 1380],
    },
    {
      location: 'galar-route-6',
      path: [
        [520, 700],
        [260, 700],
      ],
      badge: [390, 700],
    },
    {
      location: 'galar-route-7',
      path: [
        [520, 700],
        [680, 640],
        [680, 560],
      ],
      badge: [680, 600],
    },
    {
      location: 'galar-route-8',
      path: [
        [680, 560],
        [560, 470],
        [330, 380],
      ],
      badge: [500, 445],
    },
    {
      location: 'galar-route-9',
      path: [
        [330, 380],
        [520, 335],
        [780, 335],
        [820, 450],
      ],
      badge: [650, 335],
    },
    {
      location: 'galar-route-10',
      path: [
        [520, 335],
        [520, 90],
      ],
      badge: [520, 215],
    },
    // Ligações sem placa: Wild Area, minas, trilhas e o trem de Wedgehurst.
    {
      path: [
        [520, 90],
        [610, 60],
      ],
    },
    {
      path: [
        [520, 700],
        [450, 745],
      ],
    },
    {
      path: [
        [260, 700],
        [150, 780],
        [90, 870],
      ],
    },
    {
      path: [
        [520, 700],
        [520, 790],
      ],
    },
    {
      path: [
        [520, 790],
        [680, 750],
      ],
    },
    {
      path: [
        [520, 790],
        [380, 820],
      ],
    },
    {
      path: [
        [760, 1040],
        [680, 940],
        [560, 900],
        [520, 790],
      ],
    },
    {
      path: [
        [560, 900],
        [440, 880],
      ],
    },
    {
      path: [
        [560, 900],
        [400, 950],
        [300, 905],
      ],
    },
    {
      path: [
        [880, 1300],
        [880, 1180],
        [860, 1090],
      ],
      kind: 'cave',
    },
    {
      path: [
        [860, 1090],
        [760, 1040],
      ],
    },
    {
      path: [
        [760, 1040],
        [680, 1130],
      ],
    },
    {
      path: [
        [680, 1130],
        [560, 1170],
        [430, 1130],
        [290, 1150],
      ],
    },
    {
      path: [
        [290, 1150],
        [290, 1250],
      ],
    },
    {
      path: [
        [600, 1470],
        [600, 1420],
        [480, 1320],
      ],
      kind: 'cave',
    },
    {
      path: [
        [480, 1320],
        [290, 1250],
      ],
    },
    {
      path: [
        [480, 1320],
        [420, 1245],
      ],
    },
    {
      path: [
        [480, 1320],
        [620, 1250],
        [560, 1170],
      ],
    },
    {
      path: [
        [420, 1245],
        [520, 1270],
      ],
      kind: 'water',
    },
    {
      path: [
        [600, 1620],
        [760, 1640],
      ],
    },
  ],
  places: [
    { location: 'postwick', kind: 'town', at: [600, 1620], label: 'w' },
    { location: 'slumbering-weald', kind: 'forest', at: [760, 1640], label: 'n' },
    { location: 'wedgehurst', kind: 'town', at: [600, 1470], label: 'e' },
    { location: 'meetup-spot', kind: 'field', at: [600, 1420], label: 'e' },
    { location: 'rolling-fields', kind: 'field', at: [480, 1320], label: 'e' },
    { location: 'dappled-grove', kind: 'forest', at: [290, 1250], label: 's' },
    { location: 'watchtower-ruins', kind: 'ruins', at: [290, 1150], label: 's' },
    { location: 'west-lake-axewell', kind: 'water', at: [420, 1245], label: 'n' },
    { location: 'axews-eye', kind: 'island', at: [520, 1270], label: 's' },
    { location: 'east-lake-axewell', kind: 'water', at: [620, 1250], label: 'e' },
    { location: 'south-lake-miloch', kind: 'water', at: [560, 1170], label: 's' },
    { location: 'giants-seat', kind: 'mountain', at: [430, 1130], label: 'n' },
    { location: 'north-lake-miloch', kind: 'water', at: [680, 1130], label: 'e' },
    { location: 'motostoke', kind: 'city', at: [760, 1040], label: 'ne' },
    { location: 'motostoke-outskirts', kind: 'building', at: [860, 1090], label: 'e' },
    { location: 'galar-mine-no-2', kind: 'cave', at: [880, 1180], label: 'w' },
    { location: 'hulbury', kind: 'city', at: [880, 1300], label: 'w' },
    { location: 'galar-mine', kind: 'cave', at: [440, 1020], label: 's' },
    { location: 'turffield', kind: 'town', at: [160, 1060], label: 'w' },
    { location: 'motostoke-riverbank', kind: 'water', at: [680, 940], label: 'e' },
    { location: 'bridge-field', kind: 'field', at: [560, 900], label: 'e' },
    { location: 'stony-wilderness', kind: 'mountain', at: [400, 950], label: 's' },
    { location: 'dusty-bowl', kind: 'mountain', at: [300, 905], label: 'w' },
    { location: 'giants-mirror', kind: 'water', at: [440, 880], label: 'n' },
    { location: 'giants-cap', kind: 'mountain', at: [380, 820], label: 'w' },
    { location: 'hammerlocke-hills', kind: 'field', at: [520, 790], label: 'se' },
    { location: 'lake-of-outrage', kind: 'water', at: [680, 750], label: 'e' },
    { location: 'hammerlocke', kind: 'city', at: [520, 700], label: 'nw' },
    { location: 'energy-plant', kind: 'building', at: [450, 745], label: 's' },
    { location: 'stow-on-side', kind: 'town', at: [260, 700], label: 'n' },
    { location: 'glimwood-tangle', kind: 'forest', at: [150, 780], label: 'e' },
    { location: 'ballonlea', kind: 'town', at: [90, 870], label: 's' },
    { location: 'circhester', kind: 'city', at: [330, 380], label: 'w' },
    { location: 'spikemuth', kind: 'town', at: [820, 450], label: 's' },
    { location: 'wyndon', kind: 'city', at: [520, 90], label: 'w' },
    { location: 'galar-battle-tower', kind: 'tower', at: [610, 60], label: 'e' },
  ],
  captions: [
    { text: 'WILD AREA', at: [820, 860] },
    { text: 'WILD AREA', at: [300, 1330] },
  ],
  // Os covis de Dynamax estão espalhados pela Wild Area inteira, sem um ponto só.
  offMap: ['galar-wild-area-max-dens'],
}
