import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { NamedApiResource } from './dto'

/** Só o que a página do golpe usa de `/move/{slug}` (a resposta tem ~100 KB, com os aprendizes). */
interface MoveDto {
  priority: number
  effect_chance: number | null
  target: NamedApiResource
  effect_entries: { short_effect: string; language: NamedApiResource }[]
  flavor_text_entries: {
    flavor_text: string
    language: NamedApiResource
    version_group: NamedApiResource
  }[]
  meta: {
    ailment: NamedApiResource | null
    ailment_chance: number
    crit_rate: number
    drain: number
    flinch_chance: number
    healing: number
    stat_chance: number
    min_hits: number | null
    max_hits: number | null
  } | null
  stat_changes: { change: number; stat: NamedApiResource }[]
  machines: { machine: { url: string }; version_group: NamedApiResource }[]
  learned_by_pokemon: NamedApiResource[]
}

interface MachineDto {
  item: NamedApiResource
}

export interface MoveDetail {
  priority: number
  target: string
  /** Efeito curto em inglês, com a chance já no texto ("10% chance to paralyze"). */
  effect: string | null
  /** Texto do jogo em espanhol por grupo de versões (o mais recente fica em `effectEsLatest`). */
  effectEs: Record<string, string>
  effectEsLatest: string | null
  /** Efeito secundário: estado (paralisia…), recuo, crítico, dreno, cura, mudança de stat. */
  ailment: string | null
  ailmentChance: number
  flinchChance: number
  critRate: number
  /** % do dano recuperado (positivo) ou sofrido de recuo (negativo). */
  drain: number
  healing: number
  statChance: number
  statChanges: { stat: string; change: number }[]
  hits: { min: number; max: number } | null
  /** URL do `/machine` por grupo de versões (TM/TR/HM do jogo). */
  machines: Record<string, string>
  /** Ids de quem aprende em algum jogo (sem jogo selecionado). */
  learnedBy: number[]
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

export function toMoveDetail(dto: MoveDto): MoveDetail {
  const effect = dto.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect
  const effectEs: Record<string, string> = {}
  let effectEsLatest: string | null = null
  for (const entry of dto.flavor_text_entries) {
    if (entry.language.name !== 'es') continue
    effectEs[entry.version_group.name] = clean(entry.flavor_text)
    effectEsLatest = clean(entry.flavor_text)
  }
  const meta = dto.meta
  return {
    priority: dto.priority,
    target: dto.target.name,
    effect: effect
      ? clean(effect.replace(/\$effect_chance/g, String(dto.effect_chance ?? '')))
      : null,
    effectEs,
    effectEsLatest,
    ailment: meta?.ailment && meta.ailment.name !== 'none' ? meta.ailment.name : null,
    ailmentChance: meta?.ailment_chance ?? 0,
    flinchChance: meta?.flinch_chance ?? 0,
    critRate: meta?.crit_rate ?? 0,
    drain: meta?.drain ?? 0,
    healing: meta?.healing ?? 0,
    statChance: meta?.stat_chance ?? 0,
    statChanges: dto.stat_changes.map((s) => ({ stat: s.stat.name, change: s.change })),
    hits:
      meta?.min_hits != null && meta.max_hits != null
        ? { min: meta.min_hits, max: meta.max_hits }
        : null,
    machines: Object.fromEntries(dto.machines.map((m) => [m.version_group.name, m.machine.url])),
    learnedBy: dto.learned_by_pokemon.map((p) => idFromResourceUrl(p.url)),
  }
}

export async function getMoveDetail(slug: string): Promise<MoveDetail> {
  return toMoveDetail(await fetchJson<MoveDto>(`/move/${slug}`))
}

/** Item de uma máquina ("tm24"), a partir da URL completa de `/machine/{id}`. */
export async function getMachineItem(url: string): Promise<string> {
  const path = url.replace(/^.*\/api\/v2/, '')
  return (await fetchJson<MachineDto>(path)).item.name
}
