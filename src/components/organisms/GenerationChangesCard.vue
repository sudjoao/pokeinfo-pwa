<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  PokemonPastAbility,
  PokemonPastStat,
  PokemonPastTypes,
  PokemonStat,
} from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'
import { useVocabularyStore } from '@/stores/vocabulary'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  pastTypes: readonly PokemonPastTypes[]
  pastAbilities: readonly PokemonPastAbility[]
  pastStats: readonly PokemonPastStat[]
  /** Stats atuais, para mostrar "80 (hoje 90)". */
  stats: readonly PokemonStat[]
}>()

const { t, te, locale } = useI18n()
const vocabulary = useVocabularyStore()

interface Change {
  until: number
  types?: PokemonPastTypes['types']
  text?: string
}

watchEffect(() => {
  if (locale.value !== 'es') return
  for (const past of props.pastAbilities) vocabulary.ensureAbilityNameEs(past.ability)
})

function abilityName(slug: string): string {
  return (locale.value === 'es' ? vocabulary.abilities[slug] : null) || formatPokemonName(slug)
}

function statName(name: string): string {
  return te(`stat.${name}`) ? t(`stat.${name}`) : formatPokemonName(name)
}

function statText(stat: PokemonPastStat): string {
  const current = props.stats.find((s) => s.name === stat.name)?.value
  return current === undefined
    ? `${statName(stat.name)} ${stat.value}`
    : t('changes.statWas', { stat: statName(stat.name), old: stat.value, now: current })
}

function byGeneration<T extends { until: number }>(list: readonly T[]): Map<number, T[]> {
  const groups = new Map<number, T[]>()
  for (const item of list) groups.set(item.until, [...(groups.get(item.until) ?? []), item])
  return groups
}

/** Uma linha por geração e tipo de mudança, da mais antiga para a mais recente. */
const changes = computed<Change[]>(() => {
  const list: Change[] = props.pastTypes.map((past) => ({ until: past.until, types: past.types }))
  const abilitiesByGen = byGeneration(props.pastAbilities)
  for (const [until, abilities] of abilitiesByGen) {
    const names = abilities.map((a) =>
      a.isHidden ? `${abilityName(a.ability)} (${t('ability.hidden')})` : abilityName(a.ability),
    )
    list.push({ until, text: t('changes.abilities', { abilities: names.join(', ') }) })
  }
  const statsByGen = byGeneration(props.pastStats)
  for (const [until, stats] of statsByGen) {
    list.push({ until, text: stats.map(statText).join(', ') })
  }
  return list.sort((a, b) => a.until - b.until)
})
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('changes.title') }}</v-card-title>
    <v-card-text>
      <ul class="changes">
        <li v-for="(change, index) in changes" :key="index">
          <span class="text-label-large">{{ t('changes.until', { n: change.until }) }}</span>
          <span v-if="change.types" class="d-inline-flex flex-wrap ga-1 ms-2 align-center">
            <TypeChip v-for="type in change.types" :key="type" :type="type" size="small" />
          </span>
          <span v-else class="text-body-medium ms-2">{{ change.text }}</span>
        </li>
      </ul>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.changes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
