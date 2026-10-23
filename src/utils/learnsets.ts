/**
 * Quem aprende cada golpe em cada jogo, a partir dos arquivos gerados em
 * `data/generated/learnsets/` (um por grupo de versões, ver scripts/gen-reference-data.mjs).
 * Cada arquivo vira um chunk próprio e só é baixado quando a busca ou a página do golpe pede
 * aquele jogo.
 */

type LearnsetModule = { LEARNSET: Readonly<Record<string, string>> }

const loaders = import.meta.glob<LearnsetModule>('../data/generated/learnsets/*.ts')

/** "../data/generated/learnsets/scarlet-violet.ts" -> loader */
const loaderByGroup = new Map(
  Object.entries(loaders).map(([path, load]) => [path.replace(/^.*\/|\.ts$/g, ''), load]),
)

/** Jogos com learnset gerado (Legends: Z-A ainda não tem golpes na PokéAPI). */
export function hasLearnset(versionGroup: string): boolean {
  return loaderByGroup.has(versionGroup)
}

const cache = new Map<string, Promise<Readonly<Record<string, string>>>>()

/** Golpe -> aprendizes (texto compacto) de um jogo; null quando o jogo não tem learnset. */
export function loadLearnset(versionGroup: string): Promise<Readonly<Record<string, string>>> | null {
  const load = loaderByGroup.get(versionGroup)
  if (!load) return null
  let promise = cache.get(versionGroup)
  if (!promise) {
    promise = load().then((module) => module.LEARNSET)
    // Falha de rede não fica guardada: a próxima tentativa baixa de novo.
    promise.catch(() => cache.delete(versionGroup))
    cache.set(versionGroup, promise)
  }
  return promise
}

/** Mesmas letras do gerador: nível, TM/HM/TR, ovo, tutor e outros (formas, eventos…). */
export type LearnMethod = 'L' | 'M' | 'E' | 'T' | 'O'

export interface Learner {
  /** Id do Pokémon ou da forma (> 10000). */
  id: number
  method: LearnMethod
  /** Nível, só em "L" (0 = ao evoluir, conforme o jogo). */
  level: number | null
}

const ENTRY = /^([0-9a-z]+?)([LMETO])([0-9a-z]*)$/

/** "pL7,pM" -> [{ id: 25, method: 'L', level: 7 }, { id: 25, method: 'M', level: null }] */
export function decodeLearners(text: string | undefined): Learner[] {
  if (!text) return []
  return text.split(',').flatMap((entry) => {
    const match = ENTRY.exec(entry)
    if (!match) return []
    const method = match[2] as LearnMethod
    return [
      {
        id: parseInt(match[1]!, 36),
        method,
        level: method === 'L' ? parseInt(match[3] || '0', 36) : null,
      },
    ]
  })
}

/** Ids que aprendem todos os golpes (por qualquer método); vazio sem golpes. */
export function pokemonLearningAll(
  learnset: Readonly<Record<string, string>>,
  moves: readonly string[],
): Set<number> {
  if (!moves.length) return new Set()
  const [first, ...rest] = moves.map(
    (move) => new Set(decodeLearners(learnset[move]).map((learner) => learner.id)),
  )
  return new Set([...first!].filter((id) => rest.every((set) => set.has(id))))
}

export interface LearnersByMethod {
  /** Por nível, do menor para o maior (o mesmo Pokémon pode aparecer em mais de um nível). */
  L: { id: number; level: number }[]
  M: number[]
  E: number[]
  T: number[]
  O: number[]
}

/** Agrupa os aprendizes de um golpe por método, sem repetir o mesmo Pokémon no mesmo método. */
export function learnersByMethod(learners: readonly Learner[]): LearnersByMethod {
  const groups: LearnersByMethod = { L: [], M: [], E: [], T: [], O: [] }
  const seen = new Set<string>()
  for (const learner of learners) {
    const key = `${learner.method}:${learner.id}:${learner.level ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    if (learner.method === 'L') groups.L.push({ id: learner.id, level: learner.level ?? 0 })
    else groups[learner.method].push(learner.id)
  }
  groups.L.sort((a, b) => a.level - b.level || a.id - b.id)
  for (const method of ['M', 'E', 'T', 'O'] as const) groups[method].sort((a, b) => a - b)
  return groups
}
