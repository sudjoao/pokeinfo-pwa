<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import TypeChip from '@/components/atoms/TypeChip.vue'
import MultiplierBadge from '@/components/atoms/MultiplierBadge.vue'

export interface MultiplierEntry {
  type: PokemonType
  multiplier: number
}

const props = defineProps<{
  entries: readonly MultiplierEntry[]
  /** Defesa: "fraco a / resiste / imune"; ataque: "super efetivo / pouco efetivo / sem efeito". */
  mode: 'defense' | 'attack'
  /** Mostra também o grupo neutro (1×). */
  showNeutral?: boolean
  /** Nível dos títulos dos grupos (3 dentro de um card com h2; 2 quando o card não tem título). */
  headingLevel?: 2 | 3
}>()

const { t } = useI18n()

const groups = computed(() => {
  const labels =
    props.mode === 'defense'
      ? [t('detail.weakTo'), t('detail.resists'), t('detail.immuneTo'), t('types.neutral')]
      : [
          t('types.superEffective'),
          t('types.notVeryEffective'),
          t('types.noEffect'),
          t('types.neutral'),
        ]
  const by = (filter: (m: number) => boolean, order: 1 | -1) =>
    props.entries
      .filter((e) => filter(e.multiplier))
      .sort((a, b) => (a.multiplier - b.multiplier) * order)
  return [
    { key: 'strong', label: labels[0], entries: by((m) => m > 1, -1) },
    { key: 'weak', label: labels[1], entries: by((m) => m > 0 && m < 1, 1) },
    { key: 'none', label: labels[2], entries: by((m) => m === 0, 1) },
    ...(props.showNeutral
      ? [{ key: 'neutral', label: labels[3], entries: by((m) => m === 1, 1) }]
      : []),
  ].filter((group) => group.entries.length)
})
</script>

<template>
  <div class="d-flex flex-column ga-3">
    <div v-for="group in groups" :key="group.key">
      <component :is="`h${headingLevel ?? 3}`" class="text-label-large mb-1">
        {{ group.label }}
      </component>
      <ul class="multiplier-groups__list">
        <li
          v-for="entry in group.entries"
          :key="entry.type"
          class="d-inline-flex align-center ga-1"
        >
          <TypeChip :type="entry.type" size="small" />
          <MultiplierBadge :multiplier="entry.multiplier" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.multiplier-groups__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
