import type { RegionMap } from './types'

/**
 * Kalos (X/Y). Lumiose fica no centro, com as rotas saindo para todos os lados: o começo sobe do
 * sul (Vaniville, Aquacorde, Santalune), a volta pelo oeste desce a costa (Camphrier, Ambrette,
 * Cyllage) e sobe até Shalour e Coumarine, e a metade leste passa por Laverre, Dendemille, Anistar,
 * Couriway e Snowbelle, nas montanhas do sudeste. A Victory Road corre pelo sul até a Liga.
 * Kiloude, do pós-jogo, é uma cidade isolada a nordeste (chega-se de trem).
 */
export const KALOS_MAP: RegionMap = {
  width: 1100,
  height: 900,
  areas: [
    {
      kind: 'land',
      points: [
        [150, 88],
        [300, 96],
        [400, 104],
        [470, 92],
        [560, 118],
        [700, 110],
        [850, 130],
        [960, 170],
        [1070, 250],
        [1085, 400],
        [1080, 520],
        [1000, 610],
        [960, 780],
        [820, 872],
        [600, 880],
        [480, 870],
        [380, 830],
        [290, 770],
        [200, 745],
        [110, 730],
        [64, 640],
        [56, 500],
        [72, 350],
        [96, 210],
      ],
    },
    // Ilhotas: Tower of Mastery, Sea Spirit's Den e Kiloude.
    {
      kind: 'land',
      points: [
        [102, 92],
        [134, 86],
        [146, 112],
        [124, 128],
        [100, 118],
      ],
    },
    {
      kind: 'land',
      points: [
        [500, 36],
        [534, 30],
        [546, 58],
        [520, 72],
        [498, 62],
      ],
    },
    {
      kind: 'land',
      points: [
        [990, 88],
        [1060, 76],
        [1094, 126],
        [1072, 176],
        [1000, 164],
      ],
    },
    // Relevo: Badlands, a serra do Reflection Cave, o gelo do nordeste e os Alpes do sudeste.
    {
      kind: 'sand',
      points: [
        [450, 184],
        [530, 180],
        [546, 260],
        [500, 286],
        [446, 250],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [150, 222],
        [214, 216],
        [226, 270],
        [186, 292],
        [146, 268],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [70, 560],
        [126, 560],
        [130, 630],
        [96, 650],
        [66, 620],
      ],
    },
    {
      kind: 'snow',
      points: [
        [860, 180],
        [950, 180],
        [972, 240],
        [920, 268],
        [858, 240],
      ],
    },
    {
      kind: 'snow',
      points: [
        [690, 600],
        [820, 590],
        [850, 700],
        [790, 760],
        [700, 730],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [470, 800],
        [720, 790],
        [760, 846],
        [600, 866],
        [460, 850],
      ],
    },
    {
      kind: 'forest',
      points: [
        [522, 600],
        [598, 596],
        [604, 656],
        [560, 670],
        [518, 650],
      ],
    },
    {
      kind: 'forest',
      points: [
        [800, 668],
        [900, 664],
        [910, 730],
        [860, 748],
        [804, 724],
      ],
    },
  ],
  routes: [
    // Começo, do sul até Lumiose.
    {
      location: 'kalos-route-1',
      path: [
        [560, 800],
        [560, 730],
      ],
      badge: [560, 765],
    },
    {
      location: 'kalos-route-2',
      path: [
        [560, 730],
        [560, 630],
      ],
      badge: [560, 685],
    },
    {
      location: 'kalos-route-3',
      path: [
        [560, 630],
        [560, 530],
      ],
      badge: [560, 585],
    },
    {
      location: 'kalos-route-4',
      path: [
        [560, 530],
        [560, 330],
      ],
      badge: [560, 430],
    },
    {
      location: 'kalos-route-22',
      path: [
        [560, 530],
        [460, 600],
        [430, 760],
      ],
      badge: [460, 600],
    },
    // Oeste: Camphrier e a costa.
    {
      location: 'kalos-route-5',
      path: [
        [560, 330],
        [470, 380],
        [380, 420],
      ],
      badge: [470, 380],
    },
    {
      location: 'kalos-route-6',
      path: [
        [380, 420],
        [380, 510],
      ],
      badge: [380, 465],
    },
    {
      location: 'kalos-route-7',
      path: [
        [380, 420],
        [290, 450],
        [260, 555],
      ],
      badge: [290, 450],
    },
    {
      path: [
        [290, 450],
        [240, 470],
      ],
    },
    {
      location: 'kalos-route-8',
      path: [
        [260, 555],
        [220, 650],
        [150, 690],
      ],
      badge: [220, 650],
    },
    {
      location: 'kalos-route-9',
      path: [
        [150, 690],
        [100, 600],
      ],
      badge: [125, 645],
    },
    {
      path: [
        [100, 600],
        [110, 480],
      ],
      kind: 'cave',
    },
    {
      location: 'kalos-route-10',
      path: [
        [110, 480],
        [140, 340],
      ],
      badge: [125, 410],
    },
    {
      location: 'kalos-route-11',
      path: [
        [140, 340],
        [180, 255],
      ],
      badge: [160, 298],
    },
    {
      path: [
        [180, 255],
        [200, 150],
      ],
      kind: 'cave',
    },
    {
      path: [
        [200, 150],
        [122, 106],
      ],
      kind: 'water',
    },
    // Norte: Shalour → Coumarine → Lumiose.
    {
      location: 'kalos-route-12',
      path: [
        [200, 150],
        [320, 120],
        [420, 130],
      ],
      badge: [310, 122],
    },
    {
      path: [
        [420, 130],
        [430, 60],
      ],
      kind: 'water',
    },
    {
      path: [
        [430, 60],
        [520, 50],
      ],
      kind: 'water',
    },
    {
      location: 'kalos-route-13',
      path: [
        [420, 130],
        [490, 230],
        [560, 330],
      ],
      badge: [490, 230],
    },
    {
      path: [
        [560, 330],
        [605, 380],
      ],
    },
    // Leste: Laverre, Dendemille, Anistar.
    {
      location: 'kalos-route-14',
      path: [
        [560, 330],
        [640, 250],
        [710, 180],
      ],
      badge: [640, 250],
    },
    {
      location: 'kalos-route-15',
      path: [
        [710, 180],
        [800, 210],
        [800, 310],
      ],
      badge: [760, 197],
    },
    {
      path: [
        [800, 250],
        [850, 250],
      ],
    },
    {
      location: 'kalos-route-16',
      path: [
        [560, 330],
        [700, 330],
        [800, 310],
        [890, 310],
      ],
      badge: [650, 330],
    },
    {
      path: [
        [890, 310],
        [910, 215],
      ],
    },
    {
      location: 'kalos-route-17',
      path: [
        [890, 310],
        [1030, 330],
      ],
      badge: [960, 320],
    },
    // Sudeste: Couriway, Snowbelle e a Victory Road.
    {
      location: 'kalos-route-18',
      path: [
        [1030, 330],
        [1030, 440],
        [920, 530],
      ],
      badge: [1030, 400],
    },
    {
      path: [
        [1030, 440],
        [1060, 460],
      ],
    },
    {
      location: 'kalos-route-19',
      path: [
        [920, 530],
        [850, 600],
        [770, 650],
      ],
      badge: [850, 600],
    },
    {
      location: 'kalos-route-20',
      path: [
        [770, 650],
        [880, 710],
      ],
      badge: [825, 680],
    },
    {
      path: [
        [880, 710],
        [900, 770],
      ],
      kind: 'cave',
    },
    {
      location: 'kalos-route-21',
      path: [
        [770, 650],
        [760, 760],
        [700, 830],
      ],
      badge: [762, 740],
    },
    {
      path: [
        [700, 830],
        [480, 830],
        [430, 760],
      ],
      kind: 'cave',
    },
    {
      path: [
        [1020, 115],
        [1060, 145],
      ],
    },
  ],
  places: [
    { location: 'vaniville-town', kind: 'town', at: [560, 800], label: 'w' },
    { location: 'aquacorde-town', kind: 'town', at: [560, 730], label: 'w' },
    { location: 'santalune-forest', kind: 'forest', at: [560, 630], label: 'e' },
    { location: 'santalune-city', kind: 'city', at: [560, 530], label: 'e' },
    { location: 'lumiose-city', kind: 'city', at: [560, 330], label: 'w' },
    { location: 'team-flare-secret-hq', kind: 'building', at: [605, 380], label: 'e' },
    { location: 'camphrier-town', kind: 'town', at: [380, 420], label: 'n' },
    { location: 'parfum-palace', kind: 'building', at: [380, 510], label: 's' },
    { location: 'kalos-berry-fields', kind: 'field', at: [240, 470], label: 'n' },
    { location: 'connecting-cave', kind: 'cave', at: [260, 555], label: 'e' },
    { location: 'ambrette-town', kind: 'town', at: [150, 690], label: 's' },
    { location: 'glittering-cave', kind: 'cave', at: [100, 600], label: 'e' },
    { location: 'cyllage-city', kind: 'city', at: [110, 480], label: 'e' },
    { location: 'geosenge-town', kind: 'town', at: [140, 340], label: 'e' },
    { location: 'reflection-cave', kind: 'cave', at: [180, 255], label: 'e' },
    { location: 'shalour-city', kind: 'city', at: [200, 150], label: 'se' },
    { location: 'tower-of-mastery', kind: 'tower', at: [122, 106], label: 's' },
    { location: 'coumarine-city', kind: 'city', at: [420, 130], label: 'e' },
    { location: 'azure-bay', kind: 'water', at: [430, 60], label: 'w' },
    { location: 'sea-spirits-den', kind: 'cave', at: [520, 50], label: 'e' },
    { location: 'laverre-city', kind: 'city', at: [710, 180], label: 'n' },
    { location: 'lost-hotel', kind: 'building', at: [850, 250], label: 's' },
    { location: 'frost-cavern', kind: 'cave', at: [910, 215], label: 'n' },
    { location: 'dendemille-town', kind: 'town', at: [890, 310], label: 's' },
    { location: 'anistar-city', kind: 'city', at: [1030, 330], label: 'n' },
    { location: 'terminus-cave', kind: 'cave', at: [1060, 460], label: 's' },
    { location: 'couriway-town', kind: 'town', at: [920, 530], label: 'w' },
    { location: 'snowbelle-city', kind: 'city', at: [770, 650], label: 'w' },
    { location: 'pokemon-village', kind: 'town', at: [880, 710], label: 'e' },
    { location: 'unknown-dungeon', kind: 'cave', at: [900, 770], label: 'e' },
    { location: 'kalos-victory-road', kind: 'cave', at: [600, 830], label: 's' },
    { location: 'kalos-pokemon-league', kind: 'building', at: [430, 760], label: 'w' },
    { location: 'kiloude-city', kind: 'town', at: [1020, 115], label: 'w' },
    { location: 'friend-safari', kind: 'field', at: [1060, 145], label: 's' },
  ],
}
