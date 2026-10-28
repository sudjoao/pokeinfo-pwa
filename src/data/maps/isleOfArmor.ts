import type { RegionMap } from './types'

/**
 * Isle of Armor (DLC de Sword/Shield). Uma ilha só: chega-se pela estação em Fields of Honor, no
 * sudoeste; o Master Dojo fica no sul, a praia e a Brawlers' Cave no leste, as planícies de treino
 * no centro-norte e o Potbottom Desert no extremo norte, depois do Warm-Up Tunnel. Os mares em
 * volta são locais de encontro (surf), por isso aparecem como marcadores na água.
 */
export const ISLE_OF_ARMOR_MAP: RegionMap = {
  width: 900,
  height: 780,
  areas: [
    {
      kind: 'land',
      points: [
        [170, 470],
        [200, 330],
        [270, 230],
        [370, 80],
        [520, 50],
        [620, 120],
        [720, 220],
        [760, 360],
        [740, 520],
        [690, 650],
        [560, 700],
        [380, 690],
        [230, 640],
      ],
    },
    // Honeycalm Island, a noroeste.
    {
      kind: 'land',
      points: [
        [80, 180],
        [140, 160],
        [170, 205],
        [130, 250],
        [80, 235],
      ],
    },
    {
      kind: 'sand',
      points: [
        [430, 70],
        [600, 80],
        [620, 160],
        [470, 180],
      ],
    },
    {
      kind: 'forest',
      points: [
        [230, 360],
        [360, 340],
        [380, 450],
        [300, 490],
        [215, 450],
      ],
    },
    {
      kind: 'water',
      points: [
        [320, 560],
        [440, 555],
        [450, 610],
        [340, 625],
      ],
    },
    {
      kind: 'water',
      points: [
        [640, 250],
        [710, 255],
        [715, 305],
        [650, 315],
      ],
    },
    {
      kind: 'sand',
      points: [
        [650, 420],
        [745, 430],
        [735, 560],
        [655, 560],
      ],
    },
  ],
  routes: [
    // Trilhas da ilha (nenhuma tem número): ligações sem placa entre os lugares.
    {
      path: [
        [250, 560],
        [390, 590],
        [530, 610],
      ],
    },
    {
      path: [
        [530, 610],
        [690, 500],
      ],
    },
    {
      path: [
        [690, 500],
        [700, 560],
      ],
    },
    {
      path: [
        [690, 500],
        [640, 380],
      ],
    },
    {
      path: [
        [640, 380],
        [560, 300],
      ],
    },
    {
      path: [
        [560, 300],
        [680, 280],
      ],
    },
    {
      path: [
        [250, 560],
        [300, 420],
      ],
    },
    {
      path: [
        [300, 420],
        [440, 260],
      ],
    },
    {
      path: [
        [560, 300],
        [440, 260],
      ],
    },
    {
      path: [
        [440, 260],
        [430, 180],
      ],
      kind: 'cave',
    },
    {
      path: [
        [430, 180],
        [520, 110],
      ],
    },
    {
      path: [
        [300, 420],
        [330, 280],
      ],
    },
    // Surf até os mares em volta e até Honeycalm Island.
    {
      path: [
        [690, 500],
        [820, 440],
      ],
      kind: 'water',
    },
    {
      path: [
        [700, 560],
        [770, 680],
      ],
      kind: 'water',
    },
    {
      path: [
        [250, 560],
        [100, 400],
      ],
      kind: 'water',
    },
    {
      path: [
        [330, 280],
        [220, 120],
      ],
      kind: 'water',
    },
    {
      path: [
        [220, 120],
        [125, 205],
      ],
      kind: 'water',
    },
  ],
  places: [
    { location: 'fields-of-honor', kind: 'field', at: [250, 560], label: 'sw' },
    { location: 'soothing-wetlands', kind: 'water', at: [390, 590], label: 's' },
    { location: 'master-dojo', kind: 'building', at: [530, 610], label: 's' },
    { location: 'challenge-beach', kind: 'island', at: [690, 500], label: 'w' },
    { location: 'brawlers-cave', kind: 'cave', at: [700, 560], label: 'w' },
    { location: 'challenge-road', kind: 'field', at: [640, 380], label: 'e' },
    { location: 'courageous-cavern', kind: 'cave', at: [560, 300], label: 's' },
    { location: 'loop-lagoon', kind: 'water', at: [680, 280], label: 'e' },
    { location: 'forest-of-focus', kind: 'forest', at: [300, 420], label: 'w' },
    { location: 'training-lowlands', kind: 'field', at: [440, 260], label: 'ne' },
    { location: 'warm-up-tunnel', kind: 'cave', at: [430, 180], label: 'w' },
    { location: 'potbottom-desert', kind: 'field', at: [520, 110], label: 'e' },
    { location: 'isle-of-armor-caves', kind: 'cave', at: [330, 280], label: 'w' },
    { location: 'workout-sea', kind: 'water', at: [820, 440], label: 's' },
    { location: 'stepping-stone-sea', kind: 'water', at: [770, 680], label: 's' },
    { location: 'insular-sea', kind: 'water', at: [100, 400], label: 's' },
    { location: 'honeycalm-sea', kind: 'water', at: [220, 120], label: 'n' },
    { location: 'honeycalm-island', kind: 'island', at: [125, 205], label: 's' },
  ],
}
