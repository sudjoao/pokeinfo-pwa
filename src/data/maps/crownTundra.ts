import type { RegionMap } from './types'

/**
 * Crown Tundra (DLC de Sword/Shield). Terra de neve: chega-se pela estação no sul e sobe-se o
 * Slippery Slope até Freezington; o Giant's Bed ocupa o centro, a montanha sobe a noroeste
 * (Snowslide Slope, Tunnel to the Top e Path to the Peak) até a Crown Shrine no topo, e o leste
 * tem o Ballimere Lake com a Max Lair, o Giant's Foot e o mar gelado.
 */
export const CROWN_TUNDRA_MAP: RegionMap = {
  width: 900,
  height: 800,
  areas: [
    {
      kind: 'land',
      points: [
        [40, 120],
        [120, 20],
        [400, 40],
        [600, 60],
        [740, 130],
        [770, 260],
        [860, 360],
        [860, 560],
        [780, 700],
        [560, 770],
        [330, 770],
        [130, 700],
        [60, 520],
        [30, 300],
      ],
    },
    {
      kind: 'snow',
      points: [
        [60, 140],
        [130, 30],
        [380, 50],
        [600, 70],
        [720, 150],
        [740, 300],
        [600, 360],
        [420, 300],
        [300, 420],
        [180, 470],
        [60, 400],
      ],
    },
    // Pico da Crown Shrine.
    {
      kind: 'mountain',
      points: [
        [110, 40],
        [260, 50],
        [300, 200],
        [250, 300],
        [140, 260],
        [90, 140],
      ],
    },
    {
      kind: 'water',
      points: [
        [640, 470],
        [770, 455],
        [800, 540],
        [700, 585],
        [630, 545],
      ],
    },
    {
      kind: 'snow',
      points: [
        [90, 500],
        [300, 520],
        [330, 640],
        [200, 690],
        [110, 620],
      ],
    },
  ],
  routes: [
    {
      path: [
        [420, 742],
        [370, 700],
        [270, 620],
      ],
    },
    {
      path: [
        [270, 620],
        [150, 560],
      ],
    },
    {
      path: [
        [270, 620],
        [400, 440],
      ],
    },
    {
      path: [
        [400, 440],
        [330, 490],
      ],
    },
    {
      path: [
        [400, 440],
        [480, 330],
      ],
    },
    {
      path: [
        [400, 440],
        [270, 350],
      ],
    },
    {
      path: [
        [270, 350],
        [240, 250],
        [200, 160],
        [160, 70],
      ],
    },
    {
      path: [
        [400, 440],
        [620, 420],
      ],
    },
    {
      path: [
        [620, 420],
        [560, 200],
      ],
    },
    {
      path: [
        [560, 200],
        [680, 150],
      ],
    },
    {
      path: [
        [620, 420],
        [740, 370],
      ],
    },
    {
      path: [
        [620, 420],
        [710, 520],
      ],
    },
    {
      path: [
        [710, 520],
        [820, 480],
      ],
    },
    {
      path: [
        [710, 520],
        [700, 630],
      ],
    },
    {
      path: [
        [420, 742],
        [560, 700],
      ],
    },
    {
      path: [
        [560, 700],
        [600, 560],
      ],
    },
    {
      path: [
        [600, 560],
        [620, 420],
      ],
    },
    {
      path: [
        [680, 150],
        [800, 230],
      ],
    },
    {
      path: [
        [800, 230],
        [820, 90],
      ],
      kind: 'water',
    },
  ],
  places: [
    { location: 'crown-tundra-station', kind: 'town', at: [420, 742], label: 'e' },
    { location: 'slippery-slope', kind: 'mountain', at: [370, 700], label: 'w' },
    { location: 'freezington', kind: 'town', at: [270, 620], label: 'sw' },
    { location: 'frostpoint-field', kind: 'field', at: [150, 560], label: 'w' },
    { location: 'giants-bed', kind: 'field', at: [400, 440], label: 'e' },
    { location: 'old-cemetery', kind: 'building', at: [330, 490], label: 'w' },
    { location: 'galar-rock-peak-ruins', kind: 'ruins', at: [480, 330], label: 'e' },
    { location: 'snowslide-slope', kind: 'mountain', at: [270, 350], label: 'w' },
    { location: 'tunnel-to-the-top', kind: 'cave', at: [240, 250], label: 'e' },
    { location: 'path-to-the-peak', kind: 'mountain', at: [200, 160], label: 'e' },
    { location: 'crown-shrine', kind: 'special', at: [160, 70], label: 'e' },
    { location: 'three-point-pass', kind: 'field', at: [620, 420], label: 'ne' },
    { location: 'giants-foot', kind: 'field', at: [560, 200], label: 'w' },
    { location: 'galar-iceberg-ruins', kind: 'ruins', at: [680, 150], label: 'n' },
    { location: 'roaring-sea-caves', kind: 'cave', at: [800, 230], label: 'e' },
    { location: 'frigid-sea', kind: 'water', at: [820, 90], label: 's' },
    { location: 'dyna-tree-hill', kind: 'forest', at: [740, 370], label: 'e' },
    { location: 'ballimere-lake', kind: 'water', at: [710, 520], label: 's' },
    { location: 'lakeside-cave', kind: 'cave', at: [820, 480], label: 's' },
    { location: 'max-lair', kind: 'special', at: [700, 630], label: 's' },
    { location: 'split-decision-ruins', kind: 'ruins', at: [560, 700], label: 's' },
    { location: 'galar-iron-ruins', kind: 'ruins', at: [600, 560], label: 'w' },
  ],
}
