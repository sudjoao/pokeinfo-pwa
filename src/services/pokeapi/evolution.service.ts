import type { EvolutionChain, EvolutionMethod, EvolutionNode } from '@/types/pokemon'
import { describeEvolution, type EvolutionRequirement } from '@/utils/evolution'
import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { ChainLinkDto, EvolutionDetailDto } from './dto'
import type { EvolutionChainDto } from './dto'

function toRequirement(d: EvolutionDetailDto): EvolutionRequirement {
  return {
    trigger: d.trigger?.name ?? null,
    item: d.item?.name ?? null,
    heldItem: d.held_item?.name ?? null,
    gender: d.gender,
    knownMove: d.known_move?.name ?? null,
    knownMoveType: d.known_move_type?.name ?? null,
    location: d.location?.name ?? null,
    minLevel: d.min_level,
    minHappiness: d.min_happiness,
    minBeauty: d.min_beauty,
    minAffection: d.min_affection,
    nearSpecialRock: d.near_special_rock === true,
    needsMultiplayer: d.needs_multiplayer === true,
    needsOverworldRain: d.needs_overworld_rain === true,
    partySpecies: d.party_species?.name ?? null,
    partyType: d.party_type?.name ?? null,
    relativePhysicalStats: d.relative_physical_stats,
    timeOfDay: d.time_of_day || null,
    tradeSpecies: d.trade_species?.name ?? null,
    turnUpsideDown: d.turn_upside_down === true,
    region: d.region?.name ?? null,
    usedMove: d.used_move?.name ?? null,
    minMoveCount: d.min_move_count,
    minSteps: d.min_steps,
    minDamageTaken: d.min_damage_taken,
  }
}

/**
 * Converte os detalhes crus em métodos descritos, removendo duplicatas
 * (mesma frase + mesma forma resultante) e deixando os métodos padrão primeiro.
 */
function toMethods(
  details: EvolutionDetailDto[],
  speciesName: string,
  parentName: string | null,
): EvolutionMethod[] {
  const byKey = new Map<string, EvolutionMethod>()

  for (const detail of details) {
    const evolvedForm = detail.evolved_form?.name ?? null
    const baseForm = detail.base_form?.name ?? null
    let description = describeEvolution(toRequirement(detail))
    if (baseForm && parentName && baseForm !== parentName) {
      // Ex.: Sirfetch'd só evolui do Farfetch'd de Galar (base_form "farfetchd-galar").
      description += ` (a partir de ${baseForm
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')})`
    }

    const resultForm = evolvedForm && evolvedForm !== speciesName ? evolvedForm : null
    const key = `${description}|${resultForm ?? ''}`
    const existing = byKey.get(key)
    const isDefault = detail.is_default === true

    if (existing) {
      existing.isDefault ||= isDefault
      continue
    }
    byKey.set(key, {
      description,
      isDefault,
      versionGroup: detail.version_group?.name ?? null,
      resultForm,
    })
  }

  const methods = [...byKey.values()]
  // Se nenhum método for marcado como padrão, tratamos todos como principais.
  if (!methods.some((m) => m.isDefault)) methods.forEach((m) => (m.isDefault = true))
  return methods.sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

function toNode(link: ChainLinkDto, parentName: string | null = null): EvolutionNode {
  return {
    speciesId: idFromResourceUrl(link.species.url),
    name: link.species.name,
    isBaby: link.is_baby,
    methods: toMethods(link.evolution_details, link.species.name, parentName),
    evolvesTo: link.evolves_to.map((child) => toNode(child, link.species.name)),
  }
}

function toChain(dto: EvolutionChainDto): EvolutionChain {
  return {
    id: dto.id,
    babyTriggerItem: dto.baby_trigger_item?.name ?? null,
    root: toNode(dto.chain),
  }
}

export async function getEvolutionChain(id: number, signal?: AbortSignal): Promise<EvolutionChain> {
  const dto = await fetchJson<EvolutionChainDto>(`/evolution-chain/${id}`, signal)
  return toChain(dto)
}

/** Ids de todas as espécies da cadeia, em ordem de travessia. */
export function collectSpeciesIds(node: EvolutionNode): number[] {
  return [node.speciesId, ...node.evolvesTo.flatMap(collectSpeciesIds)]
}
