import type { RegionMap } from './types'

const RSE = ['ruby-sapphire', 'emerald']
const EMERALD = ['emerald']
const ORAS = ['omega-ruby-alpha-sapphire']

/**
 * Hoenn (Ruby/Sapphire, Emerald e Omega Ruby/Alpha Sapphire). O continente ocupa o oeste e o
 * norte: Littleroot no sul, Rustboro no canto noroeste, o Mt. Chimney e o deserto da Rota 111 no
 * centro e Fortree/Lilycove no nordeste. O leste e o sul são mar: Mossdeep, a cratera de
 * Sootopolis e Ever Grande, ligados pelas rotas aquáticas 124–134 até Pacifidlog e Slateport.
 */
export const HOENN_MAP: RegionMap = {
  width: 1260,
  height: 800,
  areas: [
    {
      kind: 'land',
      points: [
        [-30, -30],
        [1070, -30],
        [1070, 200],
        [1040, 260],
        [1025, 330],
        [970, 350],
        [920, 330],
        [865, 330],
        [850, 375],
        [870, 400],
        [930, 405],
        [950, 450],
        [900, 470],
        [800, 465],
        [700, 460],
        [640, 495],
        [610, 560],
        [580, 640],
        [550, 660],
        [480, 655],
        [420, 600],
        [330, 585],
        [260, 600],
        [200, 590],
        [130, 540],
        [70, 525],
        [20, 560],
        [-30, 560],
      ],
    },
    // Dewford, Mt. Pyre, Mossdeep, Sootopolis, Ever Grande e as ilhas do sul.
    {
      kind: 'land',
      points: [
        [110, 692],
        [172, 680],
        [218, 700],
        [202, 742],
        [140, 752],
        [104, 730],
      ],
    },
    {
      kind: 'land',
      points: [
        [858, 345],
        [898, 340],
        [910, 372],
        [882, 390],
        [856, 374],
      ],
    },
    {
      kind: 'land',
      points: [
        [1120, 250],
        [1195, 236],
        [1232, 282],
        [1210, 334],
        [1140, 332],
      ],
    },
    {
      kind: 'land',
      points: [
        [1032, 362],
        [1092, 346],
        [1124, 392],
        [1094, 432],
        [1042, 428],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [1046, 370],
        [1090, 358],
        [1112, 392],
        [1088, 420],
        [1050, 416],
      ],
    },
    {
      kind: 'land',
      points: [
        [1184, 430],
        [1240, 420],
        [1248, 610],
        [1196, 616],
        [1176, 520],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [1190, 450],
        [1232, 446],
        [1236, 520],
        [1196, 524],
      ],
    },
    {
      kind: 'land',
      points: [
        [836, 618],
        [862, 606],
        [886, 624],
        [870, 646],
        [842, 642],
      ],
    },
    {
      kind: 'land',
      points: [
        [930, 730],
        [956, 722],
        [972, 742],
        [952, 758],
        [930, 750],
      ],
    },
    {
      kind: 'land',
      points: [
        [1020, 760],
        [1046, 750],
        [1064, 770],
        [1042, 786],
        [1020, 778],
      ],
    },
    {
      kind: 'land',
      points: [
        [618, 748],
        [690, 736],
        [730, 756],
        [708, 784],
        [632, 784],
      ],
      only: EMERALD,
    },
    {
      kind: 'land',
      points: [
        [1160, 748],
        [1206, 740],
        [1222, 764],
        [1196, 784],
        [1160, 776],
      ],
      only: ORAS,
    },
    // Mt. Chimney (com a cratera), o deserto, as florestas e o rio da Rota 118.
    {
      kind: 'mountain',
      points: [
        [290, 170],
        [400, 138],
        [478, 176],
        [474, 252],
        [400, 272],
        [310, 246],
      ],
    },
    {
      kind: 'lava',
      points: [
        [372, 180],
        [406, 172],
        [414, 198],
        [384, 208],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [56, 34],
        [160, 28],
        [176, 108],
        [92, 118],
      ],
    },
    {
      kind: 'sand',
      points: [
        [482, 148],
        [590, 146],
        [600, 270],
        [492, 276],
      ],
    },
    {
      kind: 'forest',
      points: [
        [24, 296],
        [98, 292],
        [104, 372],
        [30, 378],
      ],
    },
    {
      kind: 'forest',
      points: [
        [612, 196],
        [690, 190],
        [700, 380],
        [618, 386],
      ],
    },
    {
      kind: 'water',
      points: [
        [574, 330],
        [600, 330],
        [606, 470],
        [580, 470],
      ],
      smooth: false,
    },
  ],
  routes: [
    {
      location: 'hoenn-route-101',
      path: [
        [250, 560],
        [250, 470],
      ],
      badge: [250, 515],
    },
    {
      location: 'hoenn-route-103',
      path: [
        [250, 470],
        [250, 400],
        [300, 400],
      ],
      badge: [250, 430],
    },
    {
      location: 'hoenn-route-102',
      path: [
        [250, 470],
        [140, 470],
      ],
      badge: [195, 470],
    },
    {
      location: 'hoenn-route-104',
      path: [
        [140, 470],
        [60, 470],
        [60, 250],
        [110, 200],
      ],
      badge: [60, 420],
    },
    {
      location: 'hoenn-route-115',
      path: [
        [110, 200],
        [110, 80],
      ],
      badge: [110, 145],
    },
    {
      location: 'hoenn-route-114',
      path: [
        [110, 80],
        [240, 80],
        [280, 100],
        [320, 100],
      ],
      badge: [190, 80],
    },
    {
      location: 'hoenn-route-116',
      path: [
        [110, 200],
        [240, 200],
        [240, 250],
      ],
      badge: [175, 200],
    },
    {
      location: 'hoenn-route-105',
      path: [
        [60, 490],
        [60, 650],
      ],
      kind: 'water',
      badge: [60, 575],
    },
    {
      location: 'hoenn-route-106',
      path: [
        [60, 650],
        [60, 720],
        [150, 720],
      ],
      kind: 'water',
      badge: [90, 720],
    },
    {
      location: 'hoenn-route-107',
      path: [
        [150, 720],
        [300, 720],
      ],
      kind: 'water',
      badge: [250, 720],
    },
    {
      location: 'hoenn-route-108',
      path: [
        [300, 720],
        [420, 720],
      ],
      kind: 'water',
      badge: [370, 720],
    },
    {
      location: 'hoenn-route-109',
      path: [
        [420, 720],
        [520, 720],
        [520, 620],
      ],
      kind: 'water',
      badge: [470, 720],
    },
    {
      location: 'hoenn-route-110',
      path: [
        [520, 420],
        [520, 620],
      ],
      badge: [520, 560],
    },
    {
      location: 'hoenn-route-117',
      path: [
        [520, 420],
        [340, 420],
      ],
      badge: [440, 420],
    },
    {
      location: 'hoenn-route-111',
      path: [
        [520, 420],
        [520, 100],
      ],
      badge: [520, 350],
    },
    {
      location: 'hoenn-route-112',
      path: [
        [520, 300],
        [380, 300],
      ],
      badge: [480, 300],
    },
    {
      location: 'hoenn-route-113',
      path: [
        [320, 100],
        [520, 100],
      ],
      badge: [420, 100],
    },
    {
      location: 'hoenn-route-118',
      path: [
        [520, 420],
        [650, 420],
      ],
      badge: [590, 420],
    },
    {
      location: 'hoenn-route-119',
      path: [
        [650, 420],
        [650, 160],
        [700, 160],
      ],
      badge: [650, 300],
    },
    {
      location: 'hoenn-route-120',
      path: [
        [700, 160],
        [820, 160],
        [820, 300],
      ],
      badge: [760, 160],
    },
    {
      location: 'hoenn-route-121',
      path: [
        [820, 300],
        [1000, 300],
      ],
      badge: [945, 300],
    },
    {
      location: 'hoenn-route-122',
      path: [
        [880, 300],
        [880, 420],
      ],
      kind: 'water',
      badge: [880, 326],
    },
    {
      location: 'hoenn-route-123',
      path: [
        [650, 420],
        [880, 420],
      ],
      badge: [770, 420],
    },
    {
      location: 'hoenn-route-124',
      path: [
        [1000, 300],
        [1160, 280],
      ],
      kind: 'water',
      badge: [1100, 288],
    },
    {
      location: 'hoenn-route-125',
      path: [
        [1160, 280],
        [1160, 180],
      ],
      kind: 'water',
      badge: [1160, 225],
    },
    {
      location: 'hoenn-route-126',
      path: [
        [1060, 293],
        [1016, 345],
        [1030, 400],
      ],
      kind: 'water',
      badge: [1018, 350],
    },
    {
      location: 'hoenn-route-127',
      path: [
        [1160, 280],
        [1160, 500],
      ],
      kind: 'water',
      badge: [1160, 420],
    },
    {
      location: 'hoenn-route-128',
      path: [
        [1160, 500],
        [1160, 620],
        [1080, 620],
      ],
      kind: 'water',
      badge: [1160, 575],
    },
    {
      location: 'hoenn-route-129',
      path: [
        [1080, 620],
        [1080, 690],
        [990, 690],
      ],
      kind: 'water',
      badge: [1040, 690],
    },
    {
      location: 'hoenn-route-130',
      path: [
        [990, 690],
        [900, 690],
      ],
      kind: 'water',
      badge: [935, 690],
    },
    {
      location: 'hoenn-route-131',
      path: [
        [900, 690],
        [820, 690],
      ],
      kind: 'water',
      badge: [888, 690],
    },
    {
      location: 'hoenn-route-132',
      path: [
        [820, 690],
        [750, 690],
      ],
      kind: 'water',
      badge: [785, 690],
    },
    {
      location: 'hoenn-route-133',
      path: [
        [750, 690],
        [680, 690],
      ],
      kind: 'water',
      badge: [715, 690],
    },
    {
      location: 'hoenn-route-134',
      path: [
        [680, 690],
        [520, 690],
      ],
      kind: 'water',
      badge: [600, 690],
    },
    // Ligações sem placa: surf, cavernas e trilhas até os locais fora da estrada.
    {
      path: [
        [300, 400],
        [300, 474],
        [520, 474],
      ],
      kind: 'water',
    },
    {
      path: [
        [250, 400],
        [200, 400],
      ],
      kind: 'water',
      only: EMERALD,
    },
    {
      path: [
        [240, 250],
        [300, 330],
        [340, 420],
      ],
      kind: 'cave',
    },
    {
      path: [
        [260, 90],
        [250, 132],
      ],
      kind: 'cave',
      only: EMERALD,
    },
    {
      path: [
        [380, 300],
        [350, 240],
        [388, 192],
      ],
    },
    {
      path: [
        [450, 300],
        [450, 242],
        [520, 172],
      ],
      kind: 'cave',
    },
    {
      path: [
        [520, 500],
        [600, 500],
      ],
      kind: 'water',
    },
    {
      path: [
        [880, 300],
        [880, 252],
      ],
    },
    {
      path: [
        [1000, 300],
        [972, 346],
      ],
      kind: 'water',
    },
    {
      path: [
        [340, 720],
        [340, 752],
      ],
      kind: 'water',
    },
    {
      path: [
        [1030, 400],
        [1068, 402],
      ],
      kind: 'water',
    },
    {
      path: [
        [1160, 560],
        [1206, 576],
      ],
    },
    {
      path: [
        [1206, 576],
        [1206, 488],
      ],
    },
    {
      path: [
        [1120, 620],
        [1120, 652],
      ],
      kind: 'water',
    },
    {
      path: [
        [860, 690],
        [860, 628],
      ],
      kind: 'water',
    },
  ],
  places: [
    { location: 'littleroot-town', kind: 'town', at: [250, 560], label: 'e' },
    { location: 'oldale-town', kind: 'town', at: [250, 470], label: 'se' },
    { location: 'hoenn-altering-cave', kind: 'cave', at: [200, 400], label: 'w', only: EMERALD },
    { location: 'petalburg-city', kind: 'city', at: [140, 470], label: 's' },
    { location: 'petalburg-woods', kind: 'forest', at: [60, 330], label: 'e' },
    { location: 'rustboro-city', kind: 'city', at: [110, 200], label: 'sw' },
    { location: 'meteor-falls', kind: 'cave', at: [110, 80], label: 'n' },
    { location: 'desert-underpass', kind: 'cave', at: [250, 132], label: 's', only: EMERALD },
    { location: 'fallarbor-town', kind: 'town', at: [320, 100], label: 'n' },
    { location: 'rusturf-tunnel', kind: 'cave', at: [240, 250], label: 'w' },
    { location: 'verdanturf-town', kind: 'town', at: [340, 420], label: 's' },
    { location: 'island-cave', kind: 'ruins', at: [100, 600], label: 'e' },
    { location: 'dewford-town', kind: 'town', at: [150, 720], label: 's' },
    { location: 'granite-cave', kind: 'cave', at: [196, 700], label: 'n' },
    { location: 'abandoned-ship', kind: 'building', at: [340, 752], label: 's', only: RSE },
    { location: 'sea-mauville', kind: 'building', at: [340, 752], label: 's', only: ORAS },
    { location: 'slateport-city', kind: 'city', at: [520, 620], label: 'w' },
    { location: 'new-mauville', kind: 'building', at: [600, 500], label: 'e' },
    { location: 'mauville-city', kind: 'city', at: [520, 420], label: 'sw' },
    { location: 'lavaridge-town', kind: 'town', at: [380, 300], label: 's' },
    { location: 'jagged-pass', kind: 'mountain', at: [350, 240], label: 'w' },
    { location: 'team-magma-hideout', kind: 'building', at: [318, 192], label: 'w' },
    { location: 'magma-hideout', kind: 'building', at: [388, 160], label: 'n', only: EMERALD },
    { location: 'fiery-path', kind: 'cave', at: [450, 242], label: 'n' },
    { location: 'mirage-tower', kind: 'tower', at: [560, 192], label: 'e', only: EMERALD },
    { location: 'desert-ruins', kind: 'ruins', at: [562, 252], label: 'e' },
    { location: 'fortree-city', kind: 'city', at: [700, 160], label: 'n' },
    { location: 'scorched-slab', kind: 'cave', at: [786, 222], label: 'w', only: ORAS },
    { location: 'ancient-tomb', kind: 'ruins', at: [850, 196], label: 'e' },
    { location: 'hoenn-safari-zone', kind: 'field', at: [880, 252], label: 'n' },
    { location: 'mt-pyre', kind: 'mountain', at: [880, 366], label: 'e' },
    { location: 'lilycove-city', kind: 'city', at: [1000, 300], label: 'n' },
    { location: 'team-aqua-hideout', kind: 'building', at: [972, 346], label: 's' },
    { location: 'mossdeep-city', kind: 'city', at: [1160, 280], label: 'nw' },
    {
      location: 'mossdeep-space-center',
      kind: 'building',
      at: [1206, 316],
      label: 's',
      only: ORAS,
    },
    { location: 'shoal-cave', kind: 'cave', at: [1160, 170], label: 'n' },
    { location: 'sootopolis-city', kind: 'city', at: [1068, 402], label: 's' },
    { location: 'cave-of-origin', kind: 'cave', at: [1092, 374], label: 'ne' },
    { location: 'seafloor-cavern', kind: 'cave', at: [1120, 652], label: 's' },
    { location: 'ever-grande-city', kind: 'city', at: [1206, 576], label: 's' },
    { location: 'hoenn-victory-road', kind: 'cave', at: [1206, 488], label: 'n' },
    { location: 'pacifidlog-town', kind: 'town', at: [820, 690], label: 's' },
    { location: 'sky-pillar', kind: 'tower', at: [860, 628], label: 'n' },
    { location: 'mirage-island', kind: 'island', at: [950, 740], label: 's' },
    { location: 'southern-island', kind: 'island', at: [1042, 768], label: 'e' },
    {
      location: 'hoenn-battle-frontier',
      kind: 'building',
      at: [690, 758],
      label: 'e',
      only: EMERALD,
    },
    { location: 'artisan-cave', kind: 'cave', at: [646, 762], label: 'w', only: EMERALD },
    { location: 'battle-resort', kind: 'island', at: [1190, 762], label: 'w', only: ORAS },
  ],
  /**
   * Fora do desenho: o voo no Latios/Latias, as ilhas de evento (Faraway, Birth, Navel Rock), as
   * cavernas que mudam de rota (Marine e Terra Cave) e as ilhas miragem de ORAS, que aparecem em
   * rotas diferentes a cada dia.
   */
  offMap: [
    'soaring-in-the-sky',
    'marine-cave',
    'terra-cave',
    'faraway-island',
    'birth-island',
    'navel-rock',
    'mirage-spot-cave',
    'mirage-spot-forest',
    'mirage-spot-island',
    'mirage-spot-mountain',
    'pathless-plain',
    'nameless-cavern',
    'fabled-cave',
    'gnarled-den',
    'trackless-forest',
    'crescent-isle',
  ],
}
