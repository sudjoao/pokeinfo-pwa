<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonAbility } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'
import { useVocabularyStore } from '@/stores/vocabulary'

const props = defineProps<{ abilities: PokemonAbility[] }>()

const { t, locale } = useI18n()
const vocabulary = useVocabularyStore()

watch(
  () => [props.abilities, locale.value] as const,
  ([abilities, currentLocale]) => {
    if (currentLocale !== 'es') return
    abilities.forEach((ability) => vocabulary.ensureAbilityNameEs(ability.name))
  },
  { immediate: true },
)

function abilityLabel(name: string): string {
  if (locale.value === 'es') {
    const resolved = vocabulary.abilities[name]
    if (resolved) return resolved
  }
  return formatPokemonName(name)
}
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.abilities') }}</v-card-title>
    <v-card-text class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="ability in abilities"
        :key="ability.name"
        size="default"
        :variant="ability.isHidden ? 'outlined' : 'tonal'"
        color="secondary"
      >
        {{ abilityLabel(ability.name) }}
        <span v-if="ability.isHidden" class="text-label-small ms-1 opacity-70">
          {{ t('detail.hiddenAbility') }}
        </span>
      </v-chip>
      <span v-if="!abilities.length" class="text-body-medium opacity-60">
        {{ t('detail.noAbilities') }}
      </span>
    </v-card-text>
  </v-card>
</template>
