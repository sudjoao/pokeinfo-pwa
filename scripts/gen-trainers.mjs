#!/usr/bin/env node
/**
 * Gera src/data/generated/trainers/{jogo}.ts: líderes de ginásio, kahunas, Elite 4 e campeão de
 * cada jogo, com o time de cada luta (primeira luta e revanches).
 *
 * A PokéAPI não tem treinadores. A fonte é a Bulbapedia: cada página de treinador traz os times nos
 * templates `{{Party}}` (jogo, local, legenda) seguidos de `{{Pokémon}}` (espécie, nível, golpes,
 * habilidade, item, Tera…), separados por título de seção ("Gym battle", "Rematch"…). A lista de
 * quem entra em cada jogo, a ordem e o tipo de especialidade são escritos à mão em `GAMES` abaixo.
 *
 * Uso: node scripts/gen-trainers.mjs [--check] [--cache <pasta>]
 *   --check  compara com os arquivos atuais e não escreve (sai com código 1 se houver diferença).
 *   --cache  guarda/reaproveita o wikitext das páginas nessa pasta (útil ao ajustar o script).
 *
 * ~125 páginas, uma requisição por vez com pausa (a Bulbapedia bloqueia acesso automático
 * agressivo; já respondeu 403 do Cloudflare em 2026-10-23). Use um User-Agent que identifique o projeto.
 */
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { GAMES as APP_GAMES } from '../src/data/games.ts'
import { DEX_INDEX_NAMES, DEX_INDEX_RANGES } from '../src/data/generated/dexIndex.ts'
import { MOVES } from '../src/data/generated/moves.ts'
import { ABILITIES } from '../src/data/generated/pokemon.ts'
import { ITEMS } from '../src/data/generated/items.ts'

const API = 'https://bulbapedia.bulbagarden.net/w/api.php'
const USER_AGENT = 'PokeInfo/1.0 (https://github.com/sudjoao/pokeinfo)'
const OUT_DIR = fileURLToPath(new URL('../src/data/generated/trainers/', import.meta.url))

// ---------------------------------------------------------------------------------------------
// Quem entra em cada jogo
// ---------------------------------------------------------------------------------------------

/**
 * Um treinador: [página, tipo de especialidade (null = time misto), opções]. Opções:
 * - `where`: regex do local (`location` do `{{Party}}`) que conta como a luta da liga; o mesmo
 *   treinador pode ter outras lutas no jogo (Giovanni no esconderijo, Larry no ginásio e na Elite 4).
 * - `heading`: regex que o título da seção precisa ter (ex.: só "Grand trial" dos kahunas).
 * - `version`: só nesta versão (Bea em Sword, Allister em Shield).
 * - `starter`: só se o jogador escolheu este inicial (trigêmeos de Striaton).
 * - `split`: nomes das lutas quando o nível vem como "61/69" sem legenda (Geeta).
 */
const t = (page, type, options = {}) => ({ page, type, ...options })

const GYM = /Gym|Stadium|Fighting Dojo|Battleground/
const LEAGUE = /Indigo Plateau|Pokémon League/

const KANTO_GYMS = [
  t('Brock', 'rock', { where: GYM }),
  t('Misty', 'water', { where: GYM }),
  t('Lt. Surge', 'electric', { where: GYM }),
  t('Erika', 'grass', { where: GYM }),
  t('Koga', 'poison', { where: GYM }),
  t('Sabrina', 'psychic', { where: GYM }),
  t('Blaine', 'fire', { where: GYM }),
  t('Giovanni', 'ground', { where: GYM }),
]
const KANTO_ELITE = [
  t('Lorelei', 'ice', { where: LEAGUE }),
  t('Bruno', 'fighting', { where: LEAGUE }),
  t('Agatha', 'ghost', { where: LEAGUE }),
  t('Lance', 'dragon', { where: LEAGUE }),
]
const KANTO = {
  gyms: KANTO_GYMS,
  elite4: KANTO_ELITE,
  champion: [t('Blue (game)', null, { where: LEAGUE })],
}

const JOHTO = {
  gyms: [
    t('Falkner', 'flying', { where: GYM }),
    t('Bugsy', 'bug', { where: GYM }),
    t('Whitney', 'normal', { where: GYM }),
    t('Morty', 'ghost', { where: GYM }),
    t('Chuck', 'fighting', { where: GYM }),
    t('Jasmine', 'steel', { where: GYM }),
    t('Pryce', 'ice', { where: GYM }),
    t('Clair', 'dragon', { where: GYM }),
  ],
  elite4: [
    t('Will', 'psychic', { where: LEAGUE }),
    t('Koga', 'poison', { where: LEAGUE }),
    t('Bruno', 'fighting', { where: LEAGUE }),
    t('Karen', 'dark', { where: LEAGUE }),
  ],
  champion: [t('Lance', 'dragon', { where: LEAGUE })],
  kanto: [
    t('Lt. Surge', 'electric', { where: GYM }),
    t('Sabrina', 'psychic', { where: GYM }),
    t('Misty', 'water', { where: GYM }),
    t('Erika', 'grass', { where: GYM }),
    t('Janine', 'poison', { where: GYM }),
    t('Brock', 'rock', { where: GYM }),
    t('Blaine', 'fire', { where: GYM }),
    t('Blue (game)', null, { where: GYM }),
  ],
  postgame: [t('Red (game)', null, { where: /Mt\. Silver/ })],
}

const HOENN_GYMS = [
  t('Roxanne', 'rock', { where: GYM }),
  t('Brawly', 'fighting', { where: GYM }),
  t('Wattson', 'electric', { where: GYM }),
  t('Flannery', 'fire', { where: GYM }),
  t('Norman', 'normal', { where: GYM }),
  t('Winona', 'flying', { where: GYM }),
  t('Tate and Liza', 'psychic', { where: GYM }),
]
const HOENN_ELITE = [
  t('Sidney', 'dark', { where: LEAGUE }),
  t('Phoebe', 'ghost', { where: LEAGUE }),
  t('Glacia', 'ice', { where: LEAGUE }),
  t('Drake', 'dragon', { where: LEAGUE }),
]
const HOENN = {
  gyms: [...HOENN_GYMS, t('Wallace', 'water', { where: GYM })],
  elite4: HOENN_ELITE,
  champion: [t('Steven', 'steel', { where: LEAGUE })],
}

const SINNOH_GYMS = {
  roark: t('Roark', 'rock', { where: GYM }),
  gardenia: t('Gardenia', 'grass', { where: GYM }),
  maylene: t('Maylene', 'fighting', { where: GYM }),
  wake: t('Crasher Wake', 'water', { where: GYM }),
  fantina: t('Fantina', 'ghost', { where: GYM }),
  byron: t('Byron', 'steel', { where: GYM }),
  candice: t('Candice', 'ice', { where: GYM }),
  volkner: t('Volkner', 'electric', { where: GYM }),
}
const SINNOH_ELITE = [
  t('Aaron', 'bug', { where: LEAGUE }),
  t('Bertha', 'ground', { where: LEAGUE }),
  t('Flint', 'fire', { where: LEAGUE }),
  t('Lucian', 'psychic', { where: LEAGUE }),
]
const g = SINNOH_GYMS
const SINNOH = {
  gyms: [g.roark, g.gardenia, g.maylene, g.wake, g.fantina, g.byron, g.candice, g.volkner],
  elite4: SINNOH_ELITE,
  champion: [t('Cynthia', null, { where: LEAGUE })],
}

const UNOVA_ELITE = [
  t('Shauntal', 'ghost', { where: LEAGUE }),
  t('Marshal', 'fighting', { where: LEAGUE }),
  t('Grimsley', 'dark', { where: LEAGUE }),
  t('Caitlin', 'psychic', { where: LEAGUE }),
]

const ALOLA_KAHUNAS = [
  t('Hala', 'fighting', { heading: /Grand trial/ }),
  t('Olivia', 'rock', { heading: /Grand trial/ }),
  t('Nanu', 'dark', { heading: /Grand trial/ }),
  t('Hapu', 'ground', { heading: /Grand trial/ }),
]
const ALOLA_ELITE_TAIL = [
  t('Olivia', 'rock', { where: LEAGUE }),
  t('Acerola', 'ghost', { where: LEAGUE }),
  t('Kahili', 'flying', { where: LEAGUE }),
]

/** Jogo -> códigos de jogo do `{{Party}}` e as seções, na ordem da tela. */
const GAMES = {
  'red-blue': { codes: ['RGB'], ...KANTO },
  yellow: { codes: ['Y', 'Yellow'], ...KANTO },
  'gold-silver': { codes: ['GSC'], ...JOHTO },
  crystal: { codes: ['GSC'], ...JOHTO },
  'ruby-sapphire': { codes: ['RS'], ...HOENN },
  emerald: {
    codes: ['E'],
    gyms: [...HOENN_GYMS, t('Juan', 'water', { where: GYM })],
    elite4: HOENN_ELITE,
    champion: [t('Wallace', 'water', { where: LEAGUE })],
    postgame: [t('Steven', 'steel', { where: /Meteor Falls/ })],
  },
  'firered-leafgreen': { codes: ['FRLG'], ...KANTO },
  'diamond-pearl': { codes: ['DP'], ...SINNOH },
  platinum: {
    codes: ['Pt'],
    ...SINNOH,
    gyms: [g.roark, g.gardenia, g.fantina, g.maylene, g.wake, g.byron, g.candice, g.volkner],
  },
  'heartgold-soulsilver': { codes: ['HGSS'], ...JOHTO },
  'black-white': {
    codes: ['BW', 'Black and White', 'B', 'Bl', 'W'],
    gyms: [
      // O líder de Striaton é o que tem vantagem sobre o inicial do jogador.
      t('Chili', 'fire', { where: GYM, starter: 495 }),
      t('Cress', 'water', { where: GYM, starter: 498 }),
      t('Cilan', 'grass', { where: GYM, starter: 501 }),
      t('Lenora', 'normal', { where: GYM }),
      t('Burgh', 'bug', { where: GYM }),
      t('Elesa', 'electric', { where: GYM }),
      t('Clay', 'ground', { where: GYM }),
      t('Skyla', 'flying', { where: GYM }),
      t('Brycen', 'ice', { where: GYM }),
      t('Drayden', 'dragon', { where: GYM, version: 'black' }),
      t('Iris', 'dragon', { where: GYM, version: 'white' }),
    ],
    elite4: UNOVA_ELITE,
    champion: [t('Alder', null, { where: LEAGUE })],
  },
  'black-2-white-2': {
    codes: ['B2W2'],
    gyms: [
      t('Cheren', 'normal', { where: GYM }),
      t('Roxie', 'poison', { where: GYM }),
      t('Burgh', 'bug', { where: GYM }),
      t('Elesa', 'electric', { where: GYM }),
      t('Clay', 'ground', { where: GYM }),
      t('Skyla', 'flying', { where: GYM }),
      t('Drayden', 'dragon', { where: GYM }),
      t('Marlon', 'water', { where: GYM }),
    ],
    elite4: UNOVA_ELITE,
    champion: [t('Iris', 'dragon', { where: LEAGUE })],
  },
  'x-y': {
    codes: ['XY'],
    gyms: [
      t('Viola', 'bug', { where: GYM }),
      t('Grant', 'rock', { where: GYM }),
      t('Korrina', 'fighting', { where: GYM }),
      t('Ramos', 'grass', { where: GYM }),
      t('Clemont', 'electric', { where: GYM }),
      t('Valerie', 'fairy', { where: GYM }),
      t('Olympia', 'psychic', { where: GYM }),
      t('Wulfric', 'ice', { where: GYM }),
    ],
    elite4: [
      t('Malva', 'fire', { where: LEAGUE }),
      t('Siebold', 'water', { where: LEAGUE }),
      t('Wikstrom', 'steel', { where: LEAGUE }),
      t('Drasna', 'dragon', { where: LEAGUE }),
    ],
    champion: [t('Diantha', null, { where: LEAGUE })],
  },
  'omega-ruby-alpha-sapphire': { codes: ['ORAS'], ...HOENN },
  'sun-moon': {
    codes: ['SM', 'SMUSUM', 'Su', 'M'],
    kahunas: ALOLA_KAHUNAS,
    elite4: [t('Hala', 'fighting', { where: LEAGUE }), ...ALOLA_ELITE_TAIL],
    champion: [t('Kukui', null, { where: LEAGUE })],
  },
  'ultra-sun-ultra-moon': {
    codes: ['USUM', 'SMUSUM', 'US', 'UM'],
    kahunas: ALOLA_KAHUNAS,
    elite4: [t('Molayne', 'steel', { where: LEAGUE }), ...ALOLA_ELITE_TAIL],
    champion: [t('Hau', null, { where: LEAGUE })],
  },
  'lets-go-pikachu-lets-go-eevee': {
    codes: ['PE', 'LGP', 'LGE'],
    gyms: KANTO_GYMS,
    elite4: KANTO_ELITE,
    champion: [t('Trace (game)', null, { where: LEAGUE })],
    postgame: [
      t('Blue (game)', null, { where: /Viridian Gym/ }),
      t('Red (game)', null, { where: LEAGUE }),
    ],
  },
  'sword-shield': {
    codes: ['SwSh', 'Sw', 'Sh'],
    gyms: [
      t('Milo', 'grass', { where: GYM }),
      t('Nessa', 'water', { where: GYM }),
      t('Kabu', 'fire', { where: GYM }),
      t('Bea', 'fighting', { where: GYM, version: 'sword' }),
      t('Allister', 'ghost', { where: GYM, version: 'shield' }),
      t('Opal', 'fairy', { where: GYM }),
      t('Gordie', 'rock', { where: GYM, version: 'sword' }),
      t('Melony', 'ice', { where: GYM, version: 'shield' }),
      t('Piers', 'dark', { where: /Spikemuth|Wyndon/ }),
      t('Raihan', 'dragon', { where: GYM }),
    ],
    champion: [t('Leon', null, { where: /Wyndon Stadium/ })],
  },
  'brilliant-diamond-shining-pearl': { codes: ['BDSP'], ...SINNOH },
  'scarlet-violet': {
    codes: ['SV'],
    // Ordem livre no jogo: aqui, a ordem recomendada pelo nível dos times.
    gyms: [
      t('Katy', 'bug', { where: GYM }),
      t('Brassius', 'grass', { where: GYM }),
      t('Iono', 'electric', { where: GYM }),
      t('Kofu', 'water', { where: GYM }),
      t('Larry', 'normal', { where: GYM }),
      t('Ryme', 'ghost', { where: GYM }),
      t('Tulip', 'psychic', { where: GYM }),
      t('Grusha', 'ice', { where: GYM }),
    ],
    elite4: [
      t('Rika', 'ground', { where: LEAGUE }),
      t('Poppy', 'steel', { where: LEAGUE }),
      t('Larry', 'flying', { where: LEAGUE }),
      t('Hassel', 'dragon', { where: LEAGUE }),
    ],
    champion: [
      t('Geeta', null, {
        where: LEAGUE,
        split: ['Champion Assessment', 'Academy Ace Tournament'],
      }),
    ],
  },
}

/** Ordem das seções na tela. */
const SECTIONS = ['gyms', 'kahunas', 'elite4', 'champion', 'kanto', 'postgame']

/** Códigos de uma versão só (o resto vale para o jogo inteiro). */
const VERSION_CODES = {
  B: 'black',
  Bl: 'black',
  W: 'white',
  Sw: 'sword',
  Sh: 'shield',
  Su: 'sun',
  M: 'moon',
  US: 'ultra-sun',
  UM: 'ultra-moon',
  LGP: 'lets-go-pikachu',
  LGE: 'lets-go-eevee',
}

/** Título de seção que só diz o jogo ou a versão ("{{game|Yellow}}", "Pokémon Sword"). */
const GAME_HEADING =
  /\{\{(game\d?|g|B2W2|LGPE)\||\{\{(B2W2|LGPE)\}\}|^\s*\[\[Pokémon [^\]]*\]\]\s*$|^\s*Pokémon (Red|Blue|Yellow|Sun|Moon|Ultra|Sword|Shield|Black|White|Scarlet|Violet|X|Y|Let's)[^>]*$/i

/** Lutas que não são da liga: torres de batalha, torneios de exibição, duplas com o jogador… */
const SKIPPED_HEADING =
  /Battle (Tower|Tree|Chateau|Agency|Maison|Frontier|Tent|Royal)|World Tournament|Pokéstar|Max Raid|Galarian Star Tournament|League Club Room|Multi Battle|Challenge Mode|Delta Episode|Memory Link|Mina's trial|tutorial|Hotel|Academy Ace|Traded/i

// ---------------------------------------------------------------------------------------------
// Wikitext
// ---------------------------------------------------------------------------------------------

/** Lê o template que começa em `start` ("{{"): nome, parâmetros e onde termina. */
function readTemplate(text, start) {
  let depth = 0
  let links = 0
  let current = ''
  const parts = []
  let i = start
  for (; i < text.length; i++) {
    const two = text.slice(i, i + 2)
    if (two === '{{') {
      depth++
      if (depth > 1) current += two
      i++
    } else if (two === '}}') {
      depth--
      if (depth === 0) {
        parts.push(current)
        i += 2
        break
      }
      current += two
      i++
    } else if (two === '[[' || two === ']]') {
      links += two === '[[' ? 1 : -1
      current += two
      i++
    } else if (text[i] === '|' && depth === 1 && links === 0) {
      parts.push(current)
      current = ''
    } else {
      current += text[i]
    }
  }
  const name = parts.shift().trim()
  const params = {}
  parts.forEach((part, index) => {
    const eq = part.indexOf('=')
    if (eq < 0) params[index + 1] = part.trim()
    else params[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
  })
  return { name, params, end: i }
}

/** Wikitext -> texto simples (links, `{{p|X}}`, comentários); null se sobrar marcação. */
function plain(text) {
  const out = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<\/?(small|sup|sub|span)[^>]*>/g, '')
    .replace(/\{\{(?:tt|color2)\|[^|}]*\|([^|}]*)\|?([^}]*)\}\}/g, (_, a, b) => b || a)
    .replace(/\{\{sup\/\d\|[^}]*\}\}/g, '')
    .replace(/\{\{[pmtai]\|([^|}]*)(?:\|([^}]*))?\}\}/g, (_, a, b) => b || a)
    .replace(
      /\{\{(?:pkmn|tc|ka|DL|rt|si|kal|game|g|item|type|stat|status|weather|Tera)\|?([^}]*)\}\}/gi,
      (_, inner) => {
        const parts = inner.split('|').filter((part) => part && !/^s$/.test(part))
        return parts.at(-1) ?? 'Tera'
      },
    )
    .replace(/\{\{(PDollar|pdollar)\}\}/g, '₽')
    .replace(/\{\{player\}\}/gi, 'the player')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return /[{}[\]<>|]/.test(out) ? null : out
}

/** Os `{{Party}}` de uma página, com os títulos de seção acima e o parágrafo logo antes. */
function parseParties(text) {
  const parties = []
  const headings = []
  const pattern = /^(={2,6})\s*(.*?)\s*\1\s*$|\{\{Party(?=[\s|])/gm
  let lastHeadingEnd = 0
  let match
  while ((match = pattern.exec(text))) {
    if (match[1]) {
      const level = match[1].length - 2
      headings.splice(level)
      headings[level] = match[2]
      lastHeadingEnd = pattern.lastIndex
      continue
    }
    const party = readTemplate(text, match.index)
    const endIndex = text.indexOf('{{Party/end', party.end)
    const body = text.slice(party.end, endIndex < 0 ? undefined : endIndex)
    const pokemon = []
    const pokemonPattern = /\{\{Pokémon(?=[\s|])/g
    let found
    while ((found = pokemonPattern.exec(body))) {
      const template = readTemplate(body, found.index)
      if (template.name === 'Pokémon') pokemon.push(template.params)
      pokemonPattern.lastIndex = template.end
    }
    const before = text.slice(lastHeadingEnd, match.index)
    parties.push({
      headings: headings.filter(Boolean),
      params: party.params,
      pokemon,
      // Só o texto entre o título e o primeiro time da seção (os seguintes repetem a seção).
      note: /\{\{Party/.test(before) ? null : before,
    })
    lastHeadingEnd = endIndex < 0 ? party.end : endIndex
    pattern.lastIndex = lastHeadingEnd
  }
  return parties
}

// ---------------------------------------------------------------------------------------------
// Nomes -> slugs do app
// ---------------------------------------------------------------------------------------------

const POKEMON_ID = new Map()
{
  const names = DEX_INDEX_NAMES.split(' ')
  let index = 0
  for (const [first, last] of DEX_INDEX_RANGES) {
    for (let id = first; id <= last; id++) POKEMON_ID.set(names[index++], id)
  }
}
const SPECIES_SLUG = new Map(
  [...POKEMON_ID].filter(([, id]) => id < 10000).map(([s, id]) => [id, s]),
)
const ABILITY_SLUGS = new Set(ABILITIES.map(([slug]) => slug))
const ITEM_SLUGS = new Set(ITEMS.map(([slug]) => slug))

/** "King's Shield" -> "kings-shield", "Will-O-Wisp" -> "will-o-wisp". */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[''.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Nomes da Bulbapedia que não viram o slug da PokéAPI só com `slugify`. */
const ALIASES = {
  faintattack: 'feint-attack',
  hijumpkick: 'high-jump-kick',
  vicegrip: 'vise-grip',
  smellingsalt: 'smelling-salts',
}

/**
 * Procura o slug comparando sem hífen: a Bulbapedia mantém a grafia antiga em times antigos
 * ("ThunderPunch", "SolarBeam", "Lightningrod", "NeverMeltIce").
 */
function lookup(slugs) {
  const compact = new Map([...slugs].map((slug) => [slug.replace(/-/g, ''), slug]))
  return (name) => {
    const slug = slugify(name)
    if (slugs.has(slug)) return slug
    const key = slug.replace(/-/g, '')
    return compact.get(key) ?? (ALIASES[key] && slugs.has(ALIASES[key]) ? ALIASES[key] : null)
  }
}
const findMove = lookup(new Set(Object.keys(MOVES)))
const findAbility = lookup(ABILITY_SLUGS)
const findItem = lookup(ITEM_SLUGS)

/** Formas: sufixo da Bulbapedia -> sufixo da PokéAPI (as que só mudam o visual ficam na espécie). */
const FORM_SUFFIXES = {
  alola: 'alola',
  galar: 'galar',
  hisui: 'hisui',
  paldea: 'paldea',
  heat: 'heat',
  wash: 'wash',
  fan: 'fan',
  frost: 'frost',
  mow: 'mow',
  origin: 'origin',
  'pom-pom': 'pom-pom',
  pau: 'pau',
  sensu: 'sensu',
  midnight: 'midnight',
  dusk: 'dusk',
  'low-key': 'low-key',
  female: 'female',
}

const warnings = new Set()
const warn = (message) => warnings.add(message)

function pokemonId(params, context) {
  const species = Number.parseInt(params.ndex, 10)
  if (!species) {
    warn(`${context}: sem ndex (${params.pokemon})`)
    return null
  }
  const form = slugify(params.form ?? '')
  if (!form) return species
  const suffix = FORM_SUFFIXES[form]
  if (!suffix) return species
  // Nome da espécie, não o slug do Pokémon padrão ("lycanroc", e não "lycanroc-midday").
  const base = slugify(params.pokemon ?? '') || SPECIES_SLUG.get(species)
  const id =
    POKEMON_ID.get(`${base}-${suffix}`) ??
    POKEMON_ID.get(`${base}-${suffix}-standard`) ??
    POKEMON_ID.get(`${base}-${suffix}-breed`)
  // Fêmea de Jellicent/Unfezant só muda o visual: fica na espécie.
  if (!id && suffix !== 'female')
    warn(`${context}: forma ${params.pokemon} ${params.form} não achada`)
  return id ?? species
}

function moveSlug(name, context) {
  const slug = findMove(name)
  if (slug) return slug
  warn(`${context}: golpe desconhecido "${name}"`)
  return null
}

function abilitySlug(name, context) {
  if (!name) return undefined
  const clean = plain(name)
  if (!clean) return undefined
  const slug = findAbility(clean)
  if (slug) return slug
  warn(`${context}: habilidade desconhecida "${name}"`)
  return undefined
}

function itemSlug(name, context) {
  if (!name) return undefined
  const clean = plain(name)
  if (!clean || /^none$/i.test(clean)) return undefined
  // Cristais Z têm duas versões na PokéAPI; a que o Pokémon segura é a "--held".
  const slug = findItem(clean) ?? findItem(`${clean} held`)
  if (slug) return slug
  warn(`${context}: item desconhecido "${name}"`)
  return undefined
}

const TYPES = new Set([
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
  'stellar',
])

/**
 * Nível, que às vezes muda conforme a luta: "{{tt|49|before Stark Mountain}}/{{tt|65|after…}}"
 * ou "61/69". Devolve [{ level, label }]; label null quando só há um.
 */
function parseLevels(raw) {
  const tagged = [...raw.matchAll(/\{\{tt\|(\d+)\|([^}]*)\}\}/g)]
  if (tagged.length > 1) return tagged.map(([, level, label]) => ({ level: +level, label }))
  if (tagged.length === 1) return [{ level: +tagged[0][1], label: null }]
  const plainLevels = raw
    .replace(/<br[\s\S]*$/, '')
    .split('/')
    .map((part) => Number.parseInt(part, 10))
  if (plainLevels.length > 1 && plainLevels.every(Boolean)) {
    return plainLevels.map((level, index) => ({ level, label: index }))
  }
  return [{ level: Number.parseInt(raw, 10) || 0, label: null }]
}

/** Legendas de nível que escolhem um lado em vez de virar outra luta. */
function levelChoice(label, game) {
  if (/^Easy Mode$/i.test(label)) return 'drop'
  if (/^Normal Mode$/i.test(label)) return 'keep'
  if (/^Ultra Sun and Ultra Moon$/.test(label))
    return game === 'ultra-sun-ultra-moon' ? 'keep' : 'drop'
  if (/^Sun and Moon$/.test(label)) return game === 'sun-moon' ? 'keep' : 'drop'
  return null
}

function buildPokemon(params, level, context) {
  const id = pokemonId(params, context)
  if (!id) return null
  const moves = [1, 2, 3, 4]
    .map((n) => params[`move${n}`])
    .filter((name) => name && name !== 'None' && name !== '—')
    .map((name) => moveSlug(plain(name) ?? name, context))
    .filter(Boolean)
  const pokemon = { id, level, moves }
  const gender = params.gender?.toLowerCase()
  if (gender === 'male') pokemon.gender = 'm'
  else if (gender === 'female') pokemon.gender = 'f'
  const ability = abilitySlug(params.ability, context)
  if (ability) pokemon.ability = ability
  if (params.heldgame && params.heldgame !== context.code) {
    // Item só numa versão do jogo (ex.: só no BDSP numa página que mistura jogos): ignora.
  } else {
    const item = itemSlug(params.held ?? params.megastone, context)
    if (item) pokemon.item = item
  }
  const tera = params.tera?.toLowerCase()
  if (tera) {
    if (TYPES.has(tera)) pokemon.tera = tera
    else warn(`${context}: Tera desconhecido "${params.tera}"`)
  }
  if (params.icon === 'mega' || params.megastone) pokemon.special = 'mega'
  else if (params.icon === 'z-power' || params['z-move1']) pokemon.special = 'z'
  else if (params.max === 'Gigantamax') pokemon.special = 'gmax'
  else if (params.max === 'Dynamax') pokemon.special = 'dmax'
  return pokemon
}

/** Título "Rematch"/"First rematch"/"After Stark Mountain" -> é revanche? */
const REMATCH = /rematch|title defense|second battle|champion (tournament|cup)|after /i

/** Detalhe que vale mostrar: o título sem as palavras que o próprio tipo de luta já diz. */
function battleDetail(heading, location) {
  if (heading === location) return undefined
  const text = (heading ?? '')
    .replace(/\((Easy Mode\/Normal Mode|pre-National Pokédex|post-National Pokédex)\)/g, '')
    .replace(/Easy Mode\/Normal Mode/g, '')
    .trim()
  if (
    !text ||
    /^(Gym battle|First battle|Initial battle|First match|Champion battle|Championship Match|Grand trial battle|Pokémon League battle|Pokémon League rematch|Pokémon League battles|Pokémon League|Champion Assessment|Paldea battles|Rematch|First rematch|Pokémon)$/i.test(
      text,
    )
  ) {
    return undefined
  }
  return text[0].toUpperCase() + text.slice(1)
}

/** Legenda do `{{Party}}`: inicial do jogador ou evolução do Eevee do rival (Yellow). */
function captionWhen(caption) {
  if (!caption) return {}
  const starter = /PlayerChoice\|0*(\d+)/.exec(caption)
  if (starter) return { starter: +starter[1] }
  const eevee = /BlueEevee\|(\w+)/.exec(caption)
  if (eevee) {
    const id = POKEMON_ID.get(eevee[1].toLowerCase())
    if (id) return { rivalEevee: id }
  }
  const version = /PlayerChoice\|(LGP|LGE)/.exec(caption)
  if (version) return { version: VERSION_CODES[version[1]] }
  return {}
}

/** Lutas de um treinador num jogo, a partir dos `{{Party}}` da página. */
function trainerBattles(parties, game, codes, spec) {
  const battles = []
  const battleByKey = new Map()

  function battleFor(kind, detail, note) {
    const key = `${kind}|${detail ?? ''}`
    let battle = battleByKey.get(key)
    if (!battle) {
      battle = { kind, ...(detail ? { detail } : {}), ...(note ? { note } : {}), teams: [] }
      battleByKey.set(key, battle)
      battles.push(battle)
    }
    return battle
  }

  for (const party of parties) {
    const code = party.params.game
    if (!codes.includes(code)) continue
    if (spec.where && !spec.where.test(party.params.location ?? '')) continue
    // Títulos abaixo de "Pokémon", sem os que só dizem o jogo ou a versão.
    const start = party.headings.findIndex((heading) => /^Pokémon$/.test(heading.trim()))
    const own = party.headings
      .slice(start + 1)
      .filter((heading) => !GAME_HEADING.test(heading))
      .map((heading) => plain(heading) ?? heading)
    const headingText = own.join(' > ')
    if (SKIPPED_HEADING.test(headingText) || SKIPPED_HEADING.test(party.params.caption ?? ''))
      continue
    if (spec.heading && !spec.heading.test(headingText)) continue

    const when = { ...captionWhen(party.params.caption) }
    if (VERSION_CODES[code]) when.version = VERSION_CODES[code]
    if (spec.version && when.version && when.version !== spec.version) continue

    const heading = own.at(-1) ?? ''
    const context = { toString: () => `${game} ${spec.page} [${headingText}]`, code }

    // Níveis com legenda dividem o time em lutas (antes/depois de um evento).
    const levelsPerPokemon = party.pokemon.map((params) => parseLevels(params.level ?? ''))
    const splitLabels = []
    for (const levels of levelsPerPokemon) {
      for (const { label } of levels) {
        if (label === null || levelChoice(String(label), game)) continue
        if (!splitLabels.includes(label)) splitLabels.push(label)
      }
    }

    const pieces = splitLabels.length ? splitLabels : [null]
    pieces.forEach((label, pieceIndex) => {
      const pokemon = []
      party.pokemon.forEach((params, index) => {
        const levels = levelsPerPokemon[index]
        let choice = levels.find((entry) => entry.label === label)
        if (!choice)
          choice = levels.find((entry) => levelChoice(String(entry.label), game) === 'keep')
        if (!choice) choice = levels.find((entry) => entry.label === null)
        if (!choice) choice = levels[0]
        const built = buildPokemon(params, choice.level, context)
        if (built) pokemon.push(built)
      })
      if (!pokemon.length) return
      let detail = battleDetail(heading, party.params.location)
      let kind = REMATCH.test(heading) ? 'rematch' : 'first'
      if (label !== null) {
        const name = typeof label === 'number' ? spec.split?.[label] : plain(label)
        if (typeof label === 'number' && !spec.split) warn(`${context}: níveis "a/b" sem split`)
        if (pieceIndex > 0) kind = 'rematch'
        detail = name ? name[0].toUpperCase() + name.slice(1) : detail
      }
      const note = pieceIndex === 0 ? cleanNote(party.note) : undefined
      battleFor(kind, detail, note).teams.push({
        ...(Object.keys(when).length ? { when } : {}),
        pokemon,
      })
    })
  }
  // Primeira luta antes das revanches (a página às vezes lista em outra ordem).
  return battles.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'first' ? -1 : 1))
}

/** Parágrafo antes do time ("Brock has five Full Heals.") em texto simples, se ficar limpo. */
function cleanNote(raw) {
  if (!raw) return undefined
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[:*{|]/.test(line) && !line.startsWith('='))
  const text = plain(lines.join(' '))
  if (!text || text.length > 280) return undefined
  return text
}

// ---------------------------------------------------------------------------------------------
// Download e saída
// ---------------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const check = args.includes('--check')
const cacheIndex = args.indexOf('--cache')
const cacheDir = cacheIndex >= 0 ? args[cacheIndex + 1] : null

async function wikitext(page) {
  const file = cacheDir ? `${cacheDir}/${encodeURIComponent(page)}.txt` : null
  if (file) {
    try {
      return await readFile(file, 'utf8')
    } catch {
      // Ainda não está no cache.
    }
  }
  const url = `${API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&redirects=1&formatversion=2`
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    const body = response.ok ? await response.json() : null
    if (body?.parse?.wikitext) {
      if (file) await writeFile(file, body.parse.wikitext)
      await new Promise((resolve) => setTimeout(resolve, 700))
      return body.parse.wikitext
    }
    if (attempt >= 4) throw new Error(`Bulbapedia falhou: ${page} (${response.status})`)
    await new Promise((resolve) => setTimeout(resolve, 3000 * attempt))
  }
}

function render(game, sections) {
  const title = APP_GAMES.find((entry) => entry.slug === game)?.title ?? game
  return `// Gerado por scripts/gen-trainers.mjs a partir da Bulbapedia (páginas dos treinadores). Não editar à mão.
import type { LeagueSection } from '@/types/trainers'

/** Líderes, Elite 4 e campeão de ${title}, na ordem do jogo. */
export const LEAGUE: readonly LeagueSection[] = ${JSON.stringify(sections)}
`
}

if (cacheDir) await mkdir(cacheDir, { recursive: true })

const pages = new Map()
for (const config of Object.values(GAMES)) {
  for (const section of SECTIONS)
    for (const spec of config[section] ?? []) pages.set(spec.page, null)
}
for (const page of pages.keys()) {
  process.stderr.write(
    `\r${[...pages.values()].filter(Boolean).length + 1}/${pages.size} ${page}          `,
  )
  pages.set(page, parseParties(await wikitext(page)))
}
process.stderr.write('\n')

const outputs = new Map()
for (const [game, config] of Object.entries(GAMES)) {
  const sections = []
  for (const key of SECTIONS) {
    const trainers = (config[key] ?? []).flatMap((spec) => {
      const battles = trainerBattles(pages.get(spec.page), game, config.codes, spec)
      if (!battles.length) {
        warn(`${game}: nenhum time de ${spec.page} (${key})`)
        return []
      }
      const first = battles[0].teams[0]
      const trainer = {
        name: spec.page.replace(/ \(game\)$/, ''),
        page: spec.page,
        ...(spec.type ? { type: spec.type } : {}),
        location:
          plain(
            pages
              .get(spec.page)
              .find(
                (p) =>
                  config.codes.includes(p.params.game) &&
                  (!spec.where || spec.where.test(p.params.location ?? '')),
              )?.params.location ?? '',
          ) ?? undefined,
        ...(spec.version || spec.starter
          ? {
              when: {
                ...(spec.version ? { version: spec.version } : {}),
                ...(spec.starter ? { starter: spec.starter } : {}),
              },
            }
          : {}),
        battles,
      }
      if (!trainer.location) delete trainer.location
      if (!first?.pokemon.length) warn(`${game}: ${spec.page} sem Pokémon`)
      return [trainer]
    })
    if (trainers.length) sections.push({ key, trainers })
  }
  outputs.set(game, render(game, sections))
}

for (const message of warnings) console.warn(`aviso: ${message}`)

if (check) {
  let differs = false
  for (const [game, content] of outputs) {
    const current = await readFile(`${OUT_DIR}${game}.ts`, 'utf8').catch(() => '')
    if (current !== content) {
      console.log(`diferente: ${game}`)
      differs = true
    }
  }
  process.exit(differs ? 1 : 0)
}

await mkdir(OUT_DIR, { recursive: true })
const existing = new Set((await readdir(OUT_DIR)).filter((file) => file.endsWith('.ts')))
for (const [game, content] of outputs) {
  await writeFile(`${OUT_DIR}${game}.ts`, content)
  existing.delete(`${game}.ts`)
}
for (const stale of existing) console.warn(`aviso: ${stale} não é mais gerado; apague à mão`)
console.log(`${outputs.size} jogos escritos em src/data/generated/trainers/`)
