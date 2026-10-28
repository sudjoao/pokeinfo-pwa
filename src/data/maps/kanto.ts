import type { RegionMap } from './types'

/** Rota 28 e Mt. Silver só existem a partir de Gold/Silver (a oeste, na divisa com Johto). */
const JOHTO_GAMES = ['gold-silver', 'crystal', 'heartgold-soulsilver']

/**
 * Kanto (Red/Blue, Yellow, FireRed/LeafGreen, Let's Go e o Kanto do pós-jogo de Gold/Silver,
 * Crystal e HeartGold/SoulSilver). A grade principal é a cruz de Saffron: Rotas 5–8 saindo da
 * cidade para os quatro lados, Cerulean ao norte, Vermilion ao sul, Celadon a oeste e Lavender a
 * leste, com o mar e as ilhas ao sul.
 */
export const KANTO_MAP: RegionMap = {
  width: 960,
  height: 780,
  areas: [
    {
      kind: 'land',
      points: [
        [-30, -30],
        [990, -30],
        [990, 290],
        [950, 380],
        [925, 470],
        [912, 560],
        [870, 610],
        [800, 650],
        [700, 662],
        [600, 652],
        [520, 650],
        [440, 660],
        [360, 650],
        [330, 628],
        [270, 632],
        [215, 606],
        [165, 565],
        [95, 528],
        [-30, 512],
      ],
    },
    // Cinnabar e as Ilhas Seafoam.
    {
      kind: 'land',
      points: [
        [258, 700],
        [296, 676],
        [342, 690],
        [348, 734],
        [306, 760],
        [262, 742],
      ],
    },
    {
      kind: 'land',
      points: [
        [418, 700],
        [446, 690],
        [470, 708],
        [458, 732],
        [426, 730],
      ],
    },
    // Mt. Moon, Rock Tunnel, a serra da Victory Road e o Mt. Silver.
    {
      kind: 'mountain',
      points: [
        [430, 150],
        [515, 138],
        [548, 178],
        [512, 222],
        [446, 216],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [818, 228],
        [880, 222],
        [896, 268],
        [866, 300],
        [820, 286],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [112, 138],
        [190, 132],
        [198, 250],
        [160, 290],
        [110, 252],
      ],
    },
    {
      kind: 'mountain',
      points: [
        [10, 330],
        [92, 318],
        [110, 380],
        [70, 410],
        [14, 400],
      ],
      only: JOHTO_GAMES,
    },
    // Viridian Forest e a Safari Zone.
    {
      kind: 'forest',
      points: [
        [262, 262],
        [338, 258],
        [350, 312],
        [304, 348],
        [256, 322],
      ],
    },
    {
      kind: 'forest',
      points: [
        [518, 506],
        [600, 500],
        [612, 548],
        [562, 572],
        [514, 552],
      ],
    },
    // Lago da Cerulean Cave.
    {
      kind: 'water',
      points: [
        [566, 112],
        [626, 104],
        [640, 150],
        [606, 172],
        [562, 154],
      ],
    },
  ],
  routes: [
    {
      location: 'kanto-route-1',
      path: [
        [300, 600],
        [300, 440],
      ],
      badge: [300, 520],
    },
    {
      location: 'kanto-route-22',
      path: [
        [300, 440],
        [150, 440],
      ],
      badge: [228, 440],
    },
    {
      location: 'kanto-route-23',
      path: [
        [150, 440],
        [150, 110],
      ],
      badge: [150, 350],
    },
    {
      location: 'kanto-route-28',
      path: [
        [150, 440],
        [60, 440],
        [60, 380],
      ],
      badge: [95, 440],
      only: JOHTO_GAMES,
    },
    {
      location: 'kanto-route-2',
      path: [
        [300, 440],
        [300, 230],
      ],
      badge: [300, 390],
    },
    {
      location: 'kanto-route-3',
      path: [
        [300, 230],
        [420, 230],
        [445, 190],
        [480, 190],
      ],
      badge: [370, 230],
    },
    {
      location: 'kanto-route-4',
      path: [
        [480, 190],
        [660, 190],
      ],
      badge: [585, 190],
    },
    {
      location: 'kanto-route-24',
      path: [
        [660, 190],
        [660, 80],
      ],
      badge: [660, 128],
    },
    {
      location: 'kanto-route-25',
      path: [
        [660, 80],
        [830, 80],
      ],
      badge: [750, 80],
    },
    {
      location: 'kanto-route-5',
      path: [
        [660, 190],
        [660, 340],
      ],
      badge: [660, 228],
    },
    {
      location: 'kanto-route-6',
      path: [
        [660, 340],
        [660, 480],
      ],
      badge: [660, 445],
    },
    {
      location: 'kanto-underground-path',
      path: [
        [660, 262],
        [622, 280],
        [622, 400],
        [660, 418],
      ],
      kind: 'cave',
      badge: [622, 300],
    },
    {
      location: 'kanto-route-9',
      path: [
        [660, 190],
        [850, 190],
      ],
      badge: [760, 190],
    },
    {
      location: 'kanto-route-10',
      path: [
        [850, 190],
        [850, 340],
      ],
      badge: [850, 222],
    },
    {
      location: 'kanto-route-8',
      path: [
        [850, 340],
        [660, 340],
      ],
      badge: [760, 340],
    },
    {
      location: 'kanto-route-7',
      path: [
        [660, 340],
        [480, 340],
      ],
      badge: [565, 340],
    },
    {
      location: 'kanto-route-16',
      path: [
        [480, 340],
        [370, 340],
      ],
      badge: [420, 340],
    },
    {
      location: 'kanto-route-17',
      path: [
        [370, 340],
        [370, 610],
      ],
      badge: [370, 478],
    },
    {
      location: 'kanto-route-18',
      path: [
        [370, 610],
        [560, 610],
      ],
      badge: [462, 610],
    },
    {
      location: 'kanto-route-11',
      path: [
        [660, 480],
        [800, 480],
      ],
      badge: [730, 480],
    },
    {
      location: 'kanto-route-12',
      path: [
        [850, 340],
        [850, 530],
      ],
      badge: [850, 440],
    },
    {
      location: 'kanto-route-13',
      path: [
        [850, 530],
        [750, 530],
      ],
      badge: [800, 530],
    },
    {
      location: 'kanto-route-14',
      path: [
        [750, 530],
        [750, 610],
      ],
      badge: [750, 572],
    },
    {
      location: 'kanto-route-15',
      path: [
        [750, 610],
        [560, 610],
      ],
      badge: [655, 610],
    },
    {
      location: 'kanto-sea-route-19',
      path: [
        [560, 610],
        [560, 712],
      ],
      kind: 'water',
      badge: [560, 668],
    },
    {
      location: 'kanto-sea-route-20',
      path: [
        [560, 712],
        [300, 712],
      ],
      kind: 'water',
      badge: [512, 712],
    },
    {
      location: 'kanto-sea-route-21',
      path: [
        [300, 712],
        [300, 600],
      ],
      kind: 'water',
      badge: [300, 660],
    },
    // Ligações sem placa: portões, docas e trilhas até os locais fora da estrada.
    {
      path: [
        [560, 610],
        [560, 548],
      ],
    },
    {
      path: [
        [660, 480],
        [700, 528],
      ],
      kind: 'water',
    },
    {
      path: [
        [660, 190],
        [604, 142],
      ],
      kind: 'water',
    },
    {
      path: [
        [850, 290],
        [906, 290],
        [906, 214],
      ],
      kind: 'water',
    },
    {
      path: [
        [850, 340],
        [890, 366],
      ],
    },
  ],
  places: [
    { location: 'pallet-town', kind: 'town', at: [300, 600], label: 'w' },
    { location: 'viridian-city', kind: 'city', at: [300, 440], label: 'se' },
    { location: 'viridian-forest', kind: 'forest', at: [300, 300], label: 'w' },
    { location: 'pewter-city', kind: 'city', at: [300, 230], label: 'n' },
    { location: 'mt-moon', kind: 'cave', at: [480, 190], label: 'n' },
    { location: 'cerulean-city', kind: 'city', at: [660, 190], label: 'ne' },
    { location: 'cerulean-cave', kind: 'cave', at: [604, 142], label: 'w' },
    { location: 'vermilion-city', kind: 'city', at: [660, 480], label: 'sw' },
    { location: 'ss-anne', kind: 'building', at: [700, 528], label: 'e' },
    { location: 'digletts-cave', kind: 'cave', at: [800, 480], label: 's' },
    { location: 'rock-tunnel', kind: 'cave', at: [850, 270], label: 'w' },
    { location: 'kanto-power-plant', kind: 'building', at: [906, 214], label: 'n' },
    { location: 'lavender-town', kind: 'town', at: [850, 340], label: 'ne' },
    { location: 'pokemon-tower', kind: 'tower', at: [890, 366], label: 's' },
    { location: 'saffron-city', kind: 'city', at: [660, 340], label: 'ne' },
    { location: 'celadon-city', kind: 'city', at: [480, 340], label: 'n' },
    { location: 'fuchsia-city', kind: 'city', at: [560, 610], label: 'se' },
    { location: 'kanto-safari-zone', kind: 'field', at: [560, 548], label: 'n' },
    { location: 'seafoam-islands', kind: 'cave', at: [444, 712], label: 's' },
    { location: 'cinnabar-island', kind: 'town', at: [300, 712], label: 'w' },
    { location: 'pokemon-mansion', kind: 'building', at: [300, 742], label: 'e' },
    {
      location: 'kanto-victory-road-2',
      kind: 'cave',
      at: [150, 200],
      label: 'e',
      only: ['red-blue', 'yellow', 'firered-leafgreen'],
    },
    {
      location: 'kanto-victory-road-1',
      kind: 'cave',
      at: [150, 200],
      label: 'e',
      only: ['lets-go-pikachu-lets-go-eevee'],
    },
    { location: 'indigo-plateau', kind: 'building', at: [150, 110], label: 'e' },
    { location: 'mt-silver', kind: 'mountain', at: [60, 380], label: 'n', only: JOHTO_GAMES },
  ],
  captions: [{ text: 'JOHTO', at: [60, 250] }],
}
