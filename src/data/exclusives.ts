/**
 * Pokémon exclusivos de cada versão, por jogo (version-group), como ids de espécie (número nacional).
 *
 * Lista estática de propósito: a PokéAPI não tem esse dado (os encontros são por área, incompletos
 * nas gerações 8 e 9 e não cobrem presentes, fósseis e evoluções). Fonte: Bulbapedia,
 * "Version-exclusive Pokémon" (seções da série principal), lida em 2026-09-11. Exclusivos das DLCs
 * (Ilha da Armadura, Tundra da Coroa, Kitakami, Blueberry) e da White Forest entram no jogo base.
 * Uma espécie com uma forma em cada versão (Basculin, Tauros de Paldea, Kyurem…) não é exclusiva
 * de nenhuma das duas e fica de fora. Red/Blue segue a distribuição internacional (Blue = Green japonês).
 * Os slugs das versões são os do endpoint `/version` da PokéAPI.
 */

export interface ExclusiveVersion {
  /** Slug da versão na PokéAPI (ex.: "sword"). */
  slug: string
  title: string
  /** Ids de espécie exclusivos desta versão, em ordem crescente. */
  species: readonly number[]
}

export interface VersionExclusives {
  versions: readonly [ExclusiveVersion, ExclusiveVersion]
}

/** Chave: slug do jogo em `data/games.ts`. Jogos de versão única (Yellow, Emerald…) não aparecem. */
export const EXCLUSIVES: Readonly<Record<string, VersionExclusives>> = {
  'red-blue': {
    versions: [
      { slug: 'red', title: 'Red', species: [23, 24, 43, 44, 45, 56, 57, 58, 59, 123, 125] },
      { slug: 'blue', title: 'Blue', species: [27, 28, 37, 38, 52, 53, 69, 70, 71, 126, 127] },
    ],
  },
  'gold-silver': {
    versions: [
      { slug: 'gold', title: 'Gold', species: [56, 57, 58, 59, 167, 168, 207, 216, 217, 226] },
      { slug: 'silver', title: 'Silver', species: [37, 38, 52, 53, 165, 166, 225, 227, 231, 232] },
    ],
  },
  'ruby-sapphire': {
    versions: [
      { slug: 'ruby', title: 'Ruby', species: [273, 274, 275, 303, 335, 338, 381, 383] },
      { slug: 'sapphire', title: 'Sapphire', species: [270, 271, 272, 302, 336, 337, 380, 382] },
    ],
  },
  'firered-leafgreen': {
    versions: [
      {
        slug: 'firered',
        title: 'FireRed',
        species: [
          23, 24, 43, 44, 45, 54, 55, 58, 59, 90, 91, 123, 125, 182, 194, 195, 198, 211, 225, 227,
          239,
        ],
      },
      {
        slug: 'leafgreen',
        title: 'LeafGreen',
        species: [
          27, 28, 37, 38, 69, 70, 71, 79, 80, 120, 121, 126, 127, 183, 184, 200, 215, 223, 224, 226,
          240, 298,
        ],
      },
    ],
  },
  'diamond-pearl': {
    versions: [
      {
        slug: 'diamond',
        title: 'Diamond',
        species: [
          86, 87, 123, 198, 246, 247, 248, 261, 262, 304, 305, 306, 352, 408, 409, 430, 434, 435,
          483,
        ],
      },
      {
        slug: 'pearl',
        title: 'Pearl',
        species: [
          79, 80, 127, 200, 228, 229, 234, 363, 364, 365, 371, 372, 373, 410, 411, 429, 431, 432,
          484,
        ],
      },
    ],
  },
  'heartgold-soulsilver': {
    versions: [
      {
        slug: 'heartgold',
        title: 'HeartGold',
        species: [
          56, 57, 58, 59, 138, 139, 167, 168, 207, 226, 231, 232, 302, 343, 344, 347, 348, 380, 382,
          458, 472,
        ],
      },
      {
        slug: 'soulsilver',
        title: 'SoulSilver',
        species: [
          37, 38, 52, 53, 140, 141, 165, 166, 216, 217, 225, 227, 303, 316, 317, 345, 346, 381, 383,
        ],
      },
    ],
  },
  'black-white': {
    versions: [
      {
        slug: 'black',
        title: 'Black',
        species: [13, 14, 15, 198, 228, 229, 285, 286, 311, 430, 574, 575, 576, 629, 630, 641, 643],
      },
      {
        slug: 'white',
        title: 'White',
        species: [
          10, 11, 12, 16, 17, 18, 29, 30, 31, 32, 33, 34, 43, 44, 45, 46, 47, 63, 64, 66, 67, 69,
          70, 71, 81, 82, 92, 93, 111, 112, 113, 125, 126, 137, 175, 176, 179, 180, 181, 182, 183,
          184, 187, 188, 189, 194, 195, 200, 239, 240, 242, 261, 262, 265, 266, 267, 268, 269, 270,
          271, 272, 273, 274, 275, 280, 281, 282, 283, 284, 287, 288, 289, 293, 294, 295, 298, 304,
          305, 306, 312, 315, 328, 329, 330, 341, 342, 371, 372, 373, 396, 397, 398, 403, 404, 405,
          406, 407, 429, 440, 462, 468, 475, 577, 578, 579, 627, 628, 642, 644,
        ],
      },
    ],
  },
  'black-2-white-2': {
    versions: [
      {
        slug: 'black-2',
        title: 'Black 2',
        species: [
          13, 14, 15, 126, 167, 168, 185, 240, 311, 325, 326, 379, 381, 427, 428, 434, 435, 438,
          443, 444, 445, 467, 574, 575, 576, 629, 630, 644,
        ],
      },
      {
        slug: 'white-2',
        title: 'White 2',
        species: [
          10, 11, 12, 122, 125, 165, 166, 239, 300, 301, 312, 322, 323, 378, 380, 431, 432, 439,
          466, 577, 578, 579, 627, 628, 643,
        ],
      },
    ],
  },
  'x-y': {
    versions: [
      {
        slug: 'x',
        title: 'X',
        species: [
          120, 121, 127, 228, 229, 261, 262, 304, 305, 306, 345, 346, 347, 348, 539, 684, 685, 692,
          693, 716,
        ],
      },
      {
        slug: 'y',
        title: 'Y',
        species: [
          90, 91, 138, 139, 140, 141, 214, 246, 247, 248, 309, 310, 509, 510, 538, 682, 683, 690,
          691, 717,
        ],
      },
    ],
  },
  'omega-ruby-alpha-sapphire': {
    versions: [
      {
        slug: 'omega-ruby',
        title: 'Omega Ruby',
        species: [
          140, 141, 250, 273, 274, 275, 303, 335, 338, 381, 383, 410, 411, 484, 538, 566, 567, 641,
          643, 690, 691,
        ],
      },
      {
        slug: 'alpha-sapphire',
        title: 'Alpha Sapphire',
        species: [
          138, 139, 249, 270, 271, 272, 302, 336, 337, 380, 382, 408, 409, 483, 539, 564, 565, 642,
          644, 692, 693,
        ],
      },
    ],
  },
  'sun-moon': {
    versions: [
      {
        slug: 'sun',
        title: 'Sun',
        species: [37, 38, 408, 409, 546, 547, 564, 565, 627, 628, 766, 776, 791, 794, 798],
      },
      {
        slug: 'moon',
        title: 'Moon',
        species: [27, 28, 410, 411, 548, 549, 566, 567, 629, 630, 765, 780, 792, 795, 797],
      },
    ],
  },
  'ultra-sun-ultra-moon': {
    versions: [
      {
        slug: 'ultra-sun',
        title: 'Ultra Sun',
        species: [
          37, 38, 228, 229, 243, 250, 381, 383, 483, 485, 546, 547, 622, 623, 627, 628, 641, 643,
          692, 693, 716, 766, 776, 791, 794, 798, 806,
        ],
      },
      {
        slug: 'ultra-moon',
        title: 'Ultra Moon',
        species: [
          27, 28, 244, 249, 309, 310, 343, 344, 380, 382, 484, 486, 548, 549, 629, 630, 642, 644,
          690, 691, 717, 765, 780, 792, 795, 797, 805,
        ],
      },
    ],
  },
  'lets-go-pikachu-lets-go-eevee': {
    versions: [
      {
        slug: 'lets-go-pikachu',
        title: "Let's Go Pikachu",
        species: [27, 28, 43, 44, 45, 56, 57, 58, 88, 89, 123],
      },
      {
        slug: 'lets-go-eevee',
        title: "Let's Go Eevee",
        species: [23, 24, 37, 38, 52, 53, 69, 70, 71, 109, 110, 127],
      },
    ],
  },
  'sword-shield': {
    versions: [
      {
        slug: 'sword',
        title: 'Sword',
        species: [
          83, 127, 138, 139, 250, 273, 274, 275, 303, 338, 371, 372, 373, 381, 383, 483, 554, 555,
          559, 560, 574, 575, 576, 627, 628, 633, 634, 635, 641, 643, 684, 692, 693, 716, 776, 782,
          783, 784, 791, 841, 865, 874, 888,
        ],
      },
      {
        slug: 'shield',
        title: 'Shield',
        species: [
          77, 78, 140, 141, 214, 222, 246, 247, 248, 249, 270, 271, 272, 302, 337, 380, 382, 443,
          444, 445, 453, 454, 484, 577, 578, 579, 629, 630, 642, 644, 682, 690, 691, 704, 705, 706,
          717, 780, 792, 842, 864, 875, 889,
        ],
      },
    ],
  },
  'brilliant-diamond-shining-pearl': {
    versions: [
      {
        slug: 'brilliant-diamond',
        title: 'Brilliant Diamond',
        species: [
          10, 11, 12, 23, 24, 58, 59, 86, 87, 123, 125, 198, 207, 239, 243, 244, 245, 246, 247, 248,
          250, 273, 274, 275, 303, 335, 338, 352, 408, 409, 430, 434, 435, 472, 483,
        ],
      },
      {
        slug: 'shining-pearl',
        title: 'Shining Pearl',
        species: [
          13, 14, 15, 27, 28, 37, 38, 79, 80, 126, 127, 144, 145, 146, 200, 216, 217, 234, 240, 249,
          270, 271, 272, 302, 336, 337, 371, 372, 373, 410, 411, 429, 431, 432, 484,
        ],
      },
    ],
  },
  'scarlet-violet': {
    versions: [
      {
        slug: 'scarlet',
        title: 'Scarlet',
        species: [
          37, 38, 207, 243, 244, 245, 246, 247, 248, 250, 381, 383, 408, 409, 425, 426, 434, 435,
          472, 483, 633, 634, 635, 643, 690, 691, 765, 791, 845, 874, 896, 936, 984, 985, 986, 987,
          988, 989, 1005, 1007, 1009, 1020, 1021,
        ],
      },
      {
        slug: 'violet',
        title: 'Violet',
        species: [
          27, 28, 190, 200, 249, 371, 372, 373, 380, 382, 410, 411, 424, 429, 484, 638, 639, 640,
          644, 692, 693, 766, 792, 875, 877, 885, 886, 887, 897, 937, 990, 991, 992, 993, 994, 995,
          1006, 1008, 1010, 1022, 1023,
        ],
      },
    ],
  },
}
