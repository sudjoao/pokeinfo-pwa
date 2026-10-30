import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { TrainerCondition } from '@/types/trainers'
import { usePokedexStore } from '@/stores/pokedex'
import { versionTitle } from '@/utils/encounters'
import { formatPokemonName } from '@/utils/pokemon'

/**
 * Texto da condição de um treinador ou time da liga: "Só Sword", "Se você escolheu Snivy",
 * "Eevee do rival virou Jolteon". Sem condição, string vazia. `.short()` dá só o nome.
 */
export function useConditionLabel(game: () => Game) {
  const { t } = useI18n()
  const pokedex = usePokedexStore()

  const nameOf = (id: number) => formatPokemonName(pokedex.entryOf(id)?.name ?? String(id))

  /** Só o nome ("Snivy", "Sword"), para chips que já têm um rótulo ao lado ("Seu inicial:"). */
  function short(when: TrainerCondition | undefined): string {
    if (!when) return ''
    if (when.starter) return nameOf(when.starter)
    if (when.rivalEevee) return nameOf(when.rivalEevee)
    return when.version ? versionTitle(game(), when.version) : ''
  }

  function full(when: TrainerCondition | undefined): string {
    if (!when) return ''
    const parts: string[] = []
    if (when.starter) parts.push(t('league.starter', { name: nameOf(when.starter) }))
    if (when.rivalEevee) parts.push(t('league.rivalEevee', { name: nameOf(when.rivalEevee) }))
    if (when.version) {
      parts.push(t('versionFilter.only', { version: versionTitle(game(), when.version) }))
    }
    return parts.join(' · ')
  }

  return Object.assign(full, { short })
}
