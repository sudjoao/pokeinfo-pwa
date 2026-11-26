<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import {
  formatDexNumber,
  formatHeight,
  formatHeightImperial,
  formatPokemonName,
  formatWeight,
  formatWeightImperial,
} from '@/utils/pokemon'
import { findGameWithDex, gameContextQuery } from '@/utils/games'
import { useDexLabel } from '@/composables/useDexLabel'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
}>()

const { t, locale } = useI18n()
const { dexLabel } = useDexLabel()

const height = computed(() => formatHeight(props.pokemon.height, locale.value))
const weight = computed(() => formatWeight(props.pokemon.weight, locale.value))
const heightImperial = computed(() => formatHeightImperial(props.pokemon.height))
const weightImperial = computed(() => formatWeightImperial(props.pokemon.weight, locale.value))

const generation = computed(() =>
  props.species?.generation ? t('detail.generationValue', { n: props.species.generation }) : null,
)

const category = computed(() => {
  if (!props.species) return null
  if (props.species.isMythical) return t('detail.categoryMythical')
  if (props.species.isLegendary) return t('detail.categoryLegendary')
  if (props.species.isBaby) return t('detail.categoryBaby')
  return t('detail.categoryCommon')
})

/**
 * Número da espécie em cada Pokédex regional. Quando um jogo da lista tem a Pokédex, o número
 * vira link para a lista desse jogo já buscando por ele; as outras (Conquest, Kalos Central
 * de uma geração sem jogo na lista…) ficam só como texto, com o nome formatado do slug.
 */
const dexNumbers = computed(() =>
  (props.species?.pokedexNumbers ?? []).map((entry) => {
    const context = findGameWithDex(entry.dex)
    return {
      key: entry.dex,
      number: formatDexNumber(entry.number, 3),
      label: context
        ? `${dexLabel(context.dex)} · ${context.game.title}`
        : formatPokemonName(entry.dex),
      to: context
        ? { name: 'home', query: { ...gameContextQuery(context), q: String(entry.number) } }
        : null,
    }
  }),
)
const showDexNumbers = ref(false)
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('detail.about') }}</v-card-title>
    <v-card-text>
      <div class="about-grid">
        <InfoTile :label="t('detail.height')" :value="height" :hint="heightImperial" />
        <InfoTile :label="t('detail.weight')" :value="weight" :hint="weightImperial" />
        <InfoTile :label="t('detail.generation')" :value="generation ?? undefined" />
        <InfoTile :label="t('detail.category')" :value="category ?? undefined" />
      </div>
      <template v-if="dexNumbers.length">
        <v-btn
          variant="text"
          size="small"
          class="mt-3 px-0 text-none"
          :aria-expanded="showDexNumbers"
          @click="showDexNumbers = !showDexNumbers"
        >
          {{
            showDexNumbers
              ? t('detail.dexNumbersHide')
              : t('detail.dexNumbers', { n: dexNumbers.length })
          }}
        </v-btn>
        <ul v-if="showDexNumbers" class="about-grid__dexes text-body-medium mt-2">
          <li v-for="entry in dexNumbers" :key="entry.key" class="d-flex align-baseline ga-2">
            <span class="about-grid__number text-label-large">{{ entry.number }}</span>
            <RouterLink v-if="entry.to" :to="entry.to" class="about-grid__link">
              {{ entry.label }}
            </RouterLink>
            <span v-else>{{ entry.label }}</span>
          </li>
        </ul>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.about-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}

@media (min-width: 600px) {
  .about-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.about-grid__dexes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.about-grid__number {
  min-width: 44px;
  font-variant-numeric: tabular-nums;
}

.about-grid__link {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
  text-underline-offset: 3px;
}
</style>
