import type { RegionMap } from './types'

/** Episódio RR: a Aether Paradise tomada pela Team Rainbow Rocket só existe em Ultra Sun/Moon. */
const USUM = ['ultra-sun-ultra-moon']

/**
 * Alola (Sun/Moon e Ultra Sun/Ultra Moon): quatro ilhas em volta da Aether Paradise. Melemele no
 * noroeste, Akala no sudoeste, Ula'ula (a maior, com o Mount Lanakila) no nordeste e Poni no
 * sudeste, com a Exeggutor Island ao lado. Cada ilha tem o seu circuito de rotas e uma das Ruins
 * dos guardiões.
 */
export const ALOLA_MAP: RegionMap = {
  width: 1120,
  height: 1000,
  areas: [
    // Melemele.
    {
      kind: 'land',
      points: [
        [40, 60],
        [120, 25],
        [250, 40],
        [370, 38],
        [392, 150],
        [362, 282],
        [260, 312],
        [120, 310],
        [40, 250],
        [24, 140],
      ],
    },
    // Akala.
    {
      kind: 'land',
      points: [
        [70, 410],
        [180, 385],
        [320, 392],
        [440, 425],
        [492, 540],
        [482, 690],
        [380, 732],
        [230, 712],
        [130, 692],
        [62, 600],
        [46, 490],
      ],
    },
    // Aether Paradise: ilha artificial, com quinas de propósito.
    {
      kind: 'land',
      smooth: false,
      points: [
        [510, 335],
        [550, 335],
        [578, 362],
        [578, 400],
        [550, 425],
        [510, 425],
        [484, 400],
        [484, 362],
      ],
    },
    // Ula'ula.
    {
      kind: 'land',
      points: [
        [620, 180],
        [700, 88],
        [860, 58],
        [1020, 66],
        [1092, 180],
        [1094, 330],
        [1062, 432],
        [980, 500],
        [862, 540],
        [760, 506],
        [650, 444],
        [604, 330],
      ],
    },
    // Poni e a Exeggutor Island.
    {
      kind: 'land',
      points: [
        [612, 700],
        [700, 650],
        [830, 640],
        [960, 680],
        [1050, 760],
        [1062, 880],
        [1010, 972],
        [880, 992],
        [740, 990],
        [640, 944],
        [596, 840],
      ],
    },
    {
      kind: 'land',
      points: [
        [518, 822],
        [548, 806],
        [574, 826],
        [566, 858],
        [530, 862],
      ],
    },
    // Relevo: vulcão Wela, Lush Jungle, Brooklet Hill, Hokulani, Lanakila, Haina, Vast Poni.
    {
      kind: 'lava',
      points: [
        [138, 608],
        [192, 598],
        [212, 640],
        [186, 672],
        [140, 662],
      ],
    },
    {
      kind: 'forest',
      points: [
        [312, 622],
        [372, 616],
        [388, 660],
        [352, 682],
        [312, 666],
      ],
    },
    {
      kind: 'water',
      points: [
        [240, 505],
        [276, 498],
        [287, 530],
        [256, 546],
        [234, 530],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [698, 102],
        [782, 96],
        [802, 150],
        [752, 176],
        [704, 152],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [800, 228],
        [860, 222],
        [866, 266],
        [826, 282],
        [794, 262],
      ],
    },
    {
      kind: 'snow',
      points: [
        [946, 80],
        [1042, 80],
        [1062, 150],
        [1010, 184],
        [948, 162],
      ],
    },
    {
      kind: 'sand',
      points: [
        [858, 288],
        [946, 284],
        [956, 372],
        [900, 392],
        [854, 360],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [718, 738],
        [802, 734],
        [818, 800],
        [770, 828],
        [724, 806],
      ],
    },
    {
      kind: 'forest',
      points: [
        [798, 858],
        [862, 852],
        [868, 902],
        [830, 918],
        [796, 902],
      ],
    },
  ],
  routes: [
    // Melemele.
    {
      location: 'alola-route-1',
      path: [
        [250, 85],
        [295, 150],
        [295, 240],
        [240, 285],
        [165, 285],
      ],
      badge: [295, 190],
    },
    {
      location: 'mahalo-trail',
      path: [
        [250, 85],
        [300, 62],
        [345, 52],
      ],
      badge: [300, 62],
    },
    {
      location: 'alola-route-2',
      path: [
        [165, 285],
        [100, 240],
        [95, 150],
      ],
      badge: [98, 200],
    },
    {
      location: 'alola-route-3',
      path: [
        [95, 150],
        [85, 100],
        [110, 60],
      ],
      badge: [86, 105],
    },
    {
      path: [
        [268, 262],
        [248, 245],
      ],
    },
    {
      path: [
        [295, 240],
        [345, 255],
      ],
    },
    {
      path: [
        [99, 236],
        [62, 232],
      ],
    },
    {
      path: [
        [97, 178],
        [132, 172],
      ],
    },
    {
      path: [
        [95, 150],
        [52, 150],
        [34, 128],
      ],
    },
    {
      path: [
        [110, 60],
        [165, 45],
        [215, 45],
      ],
      kind: 'cave',
    },
    // Akala.
    {
      location: 'alola-route-4',
      path: [
        [120, 440],
        [150, 540],
      ],
    },
    {
      location: 'alola-route-5',
      path: [
        [150, 540],
        [230, 580],
      ],
    },
    {
      location: 'alola-route-6',
      path: [
        [230, 580],
        [300, 610],
      ],
    },
    {
      location: 'alola-route-7',
      path: [
        [300, 610],
        [220, 680],
      ],
    },
    {
      location: 'alola-route-8',
      path: [
        [220, 680],
        [330, 705],
      ],
    },
    {
      location: 'alola-route-9',
      path: [
        [360, 705],
        [440, 660],
      ],
    },
    {
      path: [
        [120, 440],
        [80, 500],
      ],
    },
    {
      path: [
        [120, 440],
        [200, 452],
      ],
      kind: 'cave',
    },
    {
      path: [
        [150, 540],
        [210, 515],
      ],
    },
    {
      path: [
        [230, 580],
        [255, 525],
      ],
    },
    {
      path: [
        [220, 680],
        [170, 640],
      ],
    },
    {
      path: [
        [330, 705],
        [345, 645],
      ],
    },
    {
      path: [
        [330, 705],
        [360, 705],
      ],
      kind: 'cave',
    },
    {
      path: [
        [440, 660],
        [460, 600],
        [450, 540],
        [440, 470],
        [395, 445],
      ],
    },
    {
      path: [
        [450, 540],
        [400, 510],
      ],
    },
    // Barcos entre as ilhas, passando pela Aether Paradise.
    {
      path: [
        [165, 285],
        [200, 350],
        [120, 440],
      ],
      kind: 'water',
    },
    {
      path: [
        [440, 470],
        [530, 380],
      ],
      kind: 'water',
    },
    {
      path: [
        [530, 380],
        [650, 320],
      ],
      kind: 'water',
    },
    {
      path: [
        [700, 400],
        [640, 600],
        [630, 760],
      ],
      kind: 'water',
    },
    // Ula'ula.
    {
      location: 'alola-route-10',
      path: [
        [650, 320],
        [700, 200],
        [740, 130],
      ],
    },
    {
      location: 'alola-route-11',
      path: [
        [650, 320],
        [760, 340],
      ],
    },
    {
      location: 'alola-route-12',
      path: [
        [760, 340],
        [830, 250],
      ],
    },
    {
      location: 'alola-route-13',
      path: [
        [830, 250],
        [980, 250],
      ],
      badge: [945, 250],
    },
    {
      location: 'alola-route-14',
      path: [
        [980, 250],
        [1040, 360],
      ],
    },
    {
      location: 'alola-route-15',
      path: [
        [1040, 360],
        [960, 460],
      ],
    },
    {
      location: 'alola-route-16',
      path: [
        [960, 460],
        [850, 460],
      ],
    },
    {
      location: 'alola-route-17',
      path: [
        [850, 460],
        [790, 410],
      ],
    },
    {
      path: [
        [650, 320],
        [690, 270],
      ],
    },
    {
      path: [
        [705, 331],
        [700, 400],
      ],
    },
    {
      path: [
        [900, 250],
        [900, 310],
        [900, 360],
      ],
    },
    {
      path: [
        [920, 250],
        [920, 190],
      ],
    },
    {
      path: [
        [980, 250],
        [990, 120],
      ],
    },
    {
      path: [
        [1040, 360],
        [1075, 345],
      ],
    },
    {
      path: [
        [850, 460],
        [815, 515],
      ],
    },
    {
      path: [
        [850, 460],
        [885, 515],
      ],
    },
    // Poni.
    {
      path: [
        [630, 760],
        [545, 840],
      ],
      kind: 'water',
    },
    {
      path: [
        [630, 760],
        [650, 870],
        [730, 890],
        [830, 880],
        [910, 850],
      ],
    },
    {
      path: [
        [730, 890],
        [720, 960],
        [800, 960],
      ],
    },
    {
      path: [
        [730, 890],
        [760, 780],
      ],
    },
    {
      path: [
        [760, 780],
        [730, 690],
      ],
    },
    {
      path: [
        [760, 780],
        [790, 690],
      ],
    },
    {
      path: [
        [910, 850],
        [940, 750],
      ],
    },
    {
      path: [
        [910, 850],
        [980, 900],
        [1020, 820],
      ],
    },
    {
      path: [
        [910, 850],
        [960, 960],
      ],
    },
  ],
  places: [
    // Melemele.
    { location: 'iki-town', kind: 'town', at: [250, 85], label: 'w' },
    { location: 'ruins-of-conflict', kind: 'ruins', at: [345, 52], label: 's' },
    { location: 'trainers-school', kind: 'building', at: [248, 245], label: 'w' },
    { location: 'ten-carat-hill', kind: 'mountain', at: [345, 255], label: 'n' },
    { location: 'hauoli-city', kind: 'city', at: [165, 285], label: 'sw' },
    { location: 'hauoli-cemetery', kind: 'building', at: [62, 232], label: 's' },
    { location: 'alola-berry-fields', kind: 'field', at: [132, 172], label: 'e' },
    { location: 'verdant-cavern', kind: 'cave', at: [52, 150], label: 's' },
    { location: 'verdant-cavern--trial-site', kind: 'cave', at: [34, 128], label: 'none' },
    { location: 'melemele-meadow', kind: 'field', at: [110, 60], label: 'w' },
    { location: 'seaward-cave', kind: 'cave', at: [165, 45], label: 's' },
    { location: 'kalae-bay', kind: 'water', at: [215, 45], label: 'e' },
    { location: 'melemele-sea', kind: 'water', at: [370, 310], label: 's' },
    // Akala.
    { location: 'heahea-city', kind: 'city', at: [120, 440], label: 'w' },
    { location: 'heahea-beach', kind: 'water', at: [80, 500], label: 's' },
    { location: 'dividing-peak-tunnel', kind: 'cave', at: [200, 452], label: 'n' },
    { location: 'paniola-town', kind: 'town', at: [150, 540], label: 'w' },
    { location: 'paniola-ranch', kind: 'field', at: [210, 515], label: 'n' },
    { location: 'brooklet-hill', kind: 'water', at: [255, 525], label: 'e' },
    { location: 'royal-avenue', kind: 'town', at: [300, 610], label: 'ne' },
    { location: 'wela-volcano-park', kind: 'mountain', at: [170, 640], label: 'w' },
    { location: 'lush-jungle', kind: 'forest', at: [345, 645], label: 'e' },
    { location: 'digletts-tunnel', kind: 'cave', at: [360, 705], label: 's' },
    { location: 'konikoni-city', kind: 'city', at: [440, 660], label: 'e' },
    { location: 'memorial-hill', kind: 'mountain', at: [460, 600], label: 'e' },
    { location: 'akala-outskirts', kind: 'field', at: [450, 540], label: 'w' },
    { location: 'ruins-of-life', kind: 'ruins', at: [400, 510], label: 'w' },
    { location: 'hano-beach', kind: 'water', at: [440, 470], label: 'e' },
    { location: 'sandy-cave', kind: 'cave', at: [395, 445], label: 'w' },
    // Aether Paradise.
    { location: 'aether-paradise', kind: 'building', at: [530, 380], label: 'n' },
    { location: 'team-rockets-castle', kind: 'tower', at: [552, 404], label: 'se', only: USUM },
    // Ula'ula.
    { location: 'malie-city', kind: 'city', at: [650, 320], label: 'w' },
    { location: 'malie-garden', kind: 'field', at: [690, 270], label: 'e' },
    { location: 'mount-hokulani', kind: 'mountain', at: [740, 130], label: 'n' },
    { location: 'ulaula-beach', kind: 'water', at: [700, 400], label: 's' },
    { location: 'blush-mountain', kind: 'mountain', at: [830, 250], label: 'n' },
    { location: 'secluded-shore', kind: 'water', at: [920, 190], label: 'w' },
    { location: 'haina-desert', kind: 'field', at: [900, 310], label: 'e' },
    { location: 'ruins-of-abundance', kind: 'ruins', at: [900, 360], label: 's' },
    { location: 'tapu-village', kind: 'town', at: [980, 250], label: 'e' },
    { location: 'mount-lanakila', kind: 'mountain', at: [990, 120], label: 'n' },
    { location: 'thrifty-megamart', kind: 'building', at: [1075, 345], label: 'n' },
    { location: 'ulaula-meadow', kind: 'field', at: [850, 460], label: 'ne' },
    { location: 'lake-of-the-sunne', kind: 'water', at: [815, 515], label: 's' },
    { location: 'lake-of-the-moone', kind: 'water', at: [885, 515], label: 's' },
    { location: 'po-town', kind: 'town', at: [790, 410], label: 'n' },
    // Poni.
    { location: 'seafolk-village', kind: 'town', at: [630, 760], label: 'e' },
    { location: 'exeggutor-island', kind: 'island', at: [545, 840], label: 's' },
    { location: 'poni-wilds', kind: 'field', at: [650, 870], label: 'w' },
    { location: 'ancient-poni-path', kind: 'field', at: [730, 890], label: 's' },
    { location: 'poni-breaker-coast', kind: 'water', at: [720, 960], label: 'w' },
    { location: 'ruins-of-hope', kind: 'ruins', at: [800, 960], label: 'e' },
    { location: 'vast-poni-canyon', kind: 'mountain', at: [760, 780], label: 'e' },
    { location: 'altar-of-the-sunne', kind: 'special', at: [730, 690], label: 'w' },
    { location: 'altar-of-the-moone', kind: 'special', at: [790, 690], label: 'e' },
    { location: 'poni-grove', kind: 'forest', at: [830, 880], label: 's' },
    { location: 'poni-plains', kind: 'field', at: [910, 850], label: 'n' },
    { location: 'poni-gauntlet', kind: 'mountain', at: [940, 750], label: 'w' },
    { location: 'poni-meadow', kind: 'field', at: [980, 900], label: 'e' },
    { location: 'poni-coast', kind: 'water', at: [960, 960], label: 'e' },
    { location: 'resolution-cave', kind: 'cave', at: [1020, 820], label: 'n' },
  ],
  captions: [
    { text: 'MELEMELE', at: [300, 350] },
    { text: 'AKALA', at: [250, 770] },
    { text: "ULA'ULA", at: [960, 590] },
    { text: 'PONI', at: [1075, 690] },
  ],
  // Outras dimensões e o resort de Pokémon (só pelo menu do jogo), sem lugar em Alola.
  offMap: ['ultra-space', 'ultra-space-wilds', 'ultra-megalopolis', 'poke-pelago'],
}
