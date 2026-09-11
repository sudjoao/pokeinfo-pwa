<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Game, GameDex } from '@/data/games'
import type { CaughtFilter } from '@/composables/usePokemonList'
import type { PokemonType } from '@/types/pokemon'
import GameFilterChip from '@/components/molecules/GameFilterChip.vue'
import TypeFilterChip from '@/components/molecules/TypeFilterChip.vue'
import DexChips from '@/components/molecules/DexChips.vue'
import CaughtFilterChips from '@/components/molecules/CaughtFilterChips.vue'

/** Linha de chips de filtro da listagem (jogo, tipo, Pokédex do jogo e captura). */
defineProps<{
  game: Game | null
  dex: GameDex | null
  types: readonly PokemonType[]
  caughtFilter: CaughtFilter
  caughtCount: number
  missingCount: number
}>()

const emit = defineEmits<{
  openGame: []
  openTypes: []
  selectDex: [slug: string]
  selectCaught: [filter: CaughtFilter]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="list-filters d-flex align-center ga-2"
    role="group"
    :aria-label="t('home.gameFilterLabel')"
  >
    <GameFilterChip :label="game?.title ?? null" @click="emit('openGame')" />
    <TypeFilterChip :types="types" @click="emit('openTypes')" />
    <template v-if="game && dex && game.dexes.length > 1">
      <v-divider vertical class="list-filters__divider" />
      <DexChips :dexes="game.dexes" :selected="dex.slug" @select="emit('selectDex', $event)" />
    </template>
    <template v-if="game">
      <v-divider vertical class="list-filters__divider" />
      <CaughtFilterChips
        :selected="caughtFilter"
        :caught-count="caughtCount"
        :missing-count="missingCount"
        @select="emit('selectCaught', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
/* A linha rola na horizontal em telas estreitas, sem quebrar o cabeçalho. */
.list-filters {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.list-filters::-webkit-scrollbar {
  display: none;
}

.list-filters__divider {
  height: 24px;
  align-self: center;
  opacity: 0.4;
}
</style>
