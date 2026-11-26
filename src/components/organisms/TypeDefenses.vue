<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonAbility, PokemonType } from '@/types/pokemon'
import {
  attackMultiplier,
  battleTypes,
  hasDefensiveAbility,
  typesInGeneration,
  withAbilityDefense,
} from '@/utils/typeChart'
import { formatPokemonName } from '@/utils/pokemon'
import { useVocabularyStore } from '@/stores/vocabulary'
import MultiplierGroups from '@/components/molecules/MultiplierGroups.vue'

const props = defineProps<{
  pokemonId: number
  types: readonly PokemonType[]
  /** Habilidades do Pokémon: as que mudam a tabela (Levitate, Thick Fat…) viram chips. */
  abilities?: readonly PokemonAbility[]
  /** Geração do jogo selecionado; sem jogo, a tabela atual. */
  generation?: number
  gameTitle?: string
}>()

const { t, locale } = useI18n()
const vocabulary = useVocabularyStore()

/** Defesa (o que acerta este Pokémon) ou ataque (o que os golpes do tipo dele acertam). */
const mode = ref<'defense' | 'attack'>('defense')

const defending = computed(() => typesInGeneration(props.pokemonId, props.types, props.generation))

/** Habilidades do Pokémon que entram na tabela; a escolhida é aplicada aos multiplicadores. */
const defensiveAbilities = computed(() =>
  (props.abilities ?? []).filter((ability) => hasDefensiveAbility(ability.name)),
)
const activeAbility = ref<string | null>(null)
watch(defensiveAbilities, (list) => {
  if (!list.some((ability) => ability.name === activeAbility.value)) activeAbility.value = null
})
watch(
  () => [defensiveAbilities.value, locale.value] as const,
  ([list, currentLocale]) => {
    if (currentLocale === 'es')
      list.forEach((ability) => vocabulary.ensureAbilityNameEs(ability.name))
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

function toggleAbility(name: string): void {
  activeAbility.value = activeAbility.value === name ? null : name
}

const defenseEntries = computed(() =>
  battleTypes(props.generation).map((type) => ({
    type,
    multiplier: withAbilityDefense(
      attackMultiplier(type, defending.value, props.generation),
      type,
      activeAbility.value,
    ),
  })),
)

/** Cobertura por STAB: contra cada tipo, o melhor dos tipos do próprio Pokémon. */
const attackEntries = computed(() =>
  battleTypes(props.generation).map((type) => ({
    type,
    multiplier: Math.max(
      ...defending.value.map((own) => attackMultiplier(own, [type], props.generation)),
    ),
  })),
)

const note = computed(() =>
  props.generation && props.gameTitle
    ? t('detail.defensesGeneration', { n: props.generation, game: props.gameTitle })
    : t('detail.defensesCurrent'),
)
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('detail.typeDefenses') }}</v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <v-btn-toggle
        v-model="mode"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="align-self-start"
        :aria-label="t('detail.typeDefenses')"
      >
        <v-btn value="defense" size="small" :aria-pressed="mode === 'defense'">
          {{ t('detail.defenseMode') }}
        </v-btn>
        <v-btn value="attack" size="small" :aria-pressed="mode === 'attack'">
          {{ t('detail.attackMode') }}
        </v-btn>
      </v-btn-toggle>

      <template v-if="mode === 'defense'">
        <div v-if="defensiveAbilities.length" class="d-flex flex-wrap align-center ga-2">
          <v-chip
            v-for="ability in defensiveAbilities"
            :key="ability.name"
            size="small"
            :variant="activeAbility === ability.name ? 'flat' : 'outlined'"
            color="secondary"
            role="button"
            :aria-pressed="activeAbility === ability.name"
            @click="toggleAbility(ability.name)"
          >
            {{ t('detail.withAbility', { name: abilityLabel(ability.name) }) }}
          </v-chip>
        </div>
        <MultiplierGroups :entries="defenseEntries" mode="defense" />
        <p class="text-body-small opacity-70 mb-0">
          {{ note }}
          <template v-if="defensiveAbilities.length"> {{ t('detail.abilityHint') }}</template>
        </p>
      </template>

      <template v-else>
        <MultiplierGroups :entries="attackEntries" mode="attack" />
        <p class="text-body-small opacity-70 mb-0">{{ t('detail.attackHint') }}</p>
      </template>
    </v-card-text>
  </v-card>
</template>
