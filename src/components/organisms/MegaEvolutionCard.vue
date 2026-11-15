<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { mdiArrowDown, mdiArrowRight } from '@mdi/js'
import type { PokemonSummary } from '@/types/pokemon'
import { megaLabel, type MegaLine } from '@/utils/megas'
import EvolutionStage from '@/components/molecules/EvolutionStage.vue'

/**
 * Forma de origem e as megas dela, no mesmo visual da cadeia de evolução.
 * Horizontal (desktop): origem à esquerda, megas à direita. Vertical (celular): origem em cima.
 */
defineProps<{
  line: MegaLine
  /** Tipos de cada estágio, pelo id do Pokémon (forma). */
  summaries: Record<number, PokemonSummary>
  currentId: number
  /** Número nacional, mostrado em todos os estágios (o id das megas passa de 10000). */
  speciesId: number
}>()

const emit = defineEmits<{ select: [pokemonId: number] }>()

const { smAndDown } = useDisplay()
const { t } = useI18n()
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('detail.megaEvolution') }}</v-card-title>
    <v-card-text>
      <div class="mega-line" :class="{ 'mega-line--vertical': smAndDown }">
        <EvolutionStage
          :species-id="line.base.pokemonId"
          :name="line.base.name"
          :dex-number="speciesId"
          :summary="summaries[line.base.pokemonId]"
          :current="line.base.pokemonId === currentId"
          @select="emit('select', $event)"
        />
        <v-icon
          :icon="smAndDown ? mdiArrowDown : mdiArrowRight"
          size="28"
          class="opacity-60 flex-0-0"
        />
        <div class="mega-line__megas">
          <EvolutionStage
            v-for="mega in line.megas"
            :key="mega.pokemonId"
            :species-id="mega.pokemonId"
            :name="mega.name"
            :label="megaLabel(mega.name)"
            :dex-number="speciesId"
            :summary="summaries[mega.pokemonId]"
            :current="mega.pokemonId === currentId"
            :depth="1"
            @select="emit('select', $event)"
          />
        </div>
      </div>
      <p class="text-body-small opacity-70 mt-2 mb-0">{{ t('detail.megaTap') }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.mega-line {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0 8px;
}

.mega-line__megas {
  display: flex;
  gap: 12px;
}

.mega-line--vertical {
  flex-direction: column;
  gap: 4px;
}

.mega-line--vertical > .mega-line__megas {
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
