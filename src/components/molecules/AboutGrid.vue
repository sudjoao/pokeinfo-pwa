<script setup lang="ts">
import { computed } from 'vue'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import { formatEggGroup, formatHeight, formatWeight, genderRatio } from '@/utils/pokemon'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
}>()

const gender = computed(() => {
  if (!props.species) return null
  const ratio = genderRatio(props.species.genderRate)
  if (!ratio) return 'Sem gênero'
  return `♀ ${ratio.female}% · ♂ ${ratio.male}%`
})

const eggGroups = computed(() => props.species?.eggGroups.map(formatEggGroup).join(', ') ?? null)

const generation = computed(() =>
  props.species?.generation ? `Geração ${props.species.generation}` : null,
)

const category = computed(() => {
  if (!props.species) return null
  if (props.species.isMythical) return 'Mítico'
  if (props.species.isLegendary) return 'Lendário'
  if (props.species.isBaby) return 'Bebê'
  return 'Comum'
})
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">Sobre</v-card-title>
    <v-card-text>
      <div class="about-grid">
        <InfoTile label="Altura" :value="formatHeight(pokemon.height)" />
        <InfoTile label="Peso" :value="formatWeight(pokemon.weight)" />
        <InfoTile label="Gênero" :value="gender ?? undefined" />
        <InfoTile label="Grupos de ovo" :value="eggGroups ?? undefined" />
        <InfoTile label="Geração" :value="generation ?? undefined" />
        <InfoTile label="Categoria" :value="category ?? undefined" />
        <InfoTile
          label="Taxa de captura"
          :value="species ? String(species.captureRate) : undefined"
        />
        <InfoTile
          label="Felicidade base"
          :value="species?.baseHappiness != null ? String(species.baseHappiness) : undefined"
        />
      </div>
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
</style>
