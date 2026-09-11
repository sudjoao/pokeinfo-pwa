<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gameContextQuery } from '@/utils/games'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import type { PokemonSummary } from '@/types/pokemon'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import GameFilterChip from '@/components/molecules/GameFilterChip.vue'
import DexChips from '@/components/molecules/DexChips.vue'
import CaughtFilterChips from '@/components/molecules/CaughtFilterChips.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'

const {
  query,
  games,
  game,
  dex,
  setGame,
  setDex,
  caughtFilter,
  setCaughtFilter,
  caughtIds,
  caughtCount,
  missingCount,
  toggleCaught,
  items,
  listKey,
  status,
  errorMessage,
  isEmpty,
  sourceLoading,
  sourceError,
  loadMore,
  retry,
} = usePokemonList()

const router = useRouter()
const cry = useCry()

const pickerOpen = ref(false)

/** Altura do cabeçalho: busca (48) + linha de chips (32) + espaçamentos. */
const HEADER_EXTENSION_HEIGHT = 108

const emptyTitle = computed(() => {
  if (!game.value || !caughtFilter.value || query.value.trim()) return 'Nenhum Pokémon encontrado'
  return caughtFilter.value === 'caught' ? 'Nenhum capturado ainda' : 'Pokédex completa!'
})

const emptyMessage = computed(() => {
  if (game.value && dex.value && caughtFilter.value && !query.value.trim()) {
    return caughtFilter.value === 'caught'
      ? `Toque na Poké Bola de um card para marcar o que você já capturou em ${game.value.title}.`
      : `Você já capturou todos os Pokémon da Pokédex de ${dex.value.label} em ${game.value.title}.`
  }
  return game.value && dex.value
    ? `Nenhum Pokémon com esse nome ou número na Pokédex de ${dex.value.label} (${game.value.title}).`
    : 'Tente buscar por outro nome ou número da Pokédex.'
})

/**
 * O grito toca aqui, dentro do toque, porque o iOS bloqueia áudio fora de um gesto do usuário.
 * O jogo selecionado vai junto na URL para o detalhe mostrar o número regional e navegar pela dex.
 */
function openPokemon(pokemon: PokemonSummary): void {
  cry.play(pokemon.id)
  const context = game.value && dex.value ? { game: game.value, dex: dex.value } : null
  router.push({ name: 'pokemon', params: { id: pokemon.id }, query: gameContextQuery(context) })
}
</script>

<template>
  <DefaultLayout :extension-height="HEADER_EXTENSION_HEIGHT">
    <template #header>
      <SearchField v-model="query" />
      <div
        class="home-filters d-flex align-center ga-2 mt-2"
        role="group"
        aria-label="Filtro por jogo"
      >
        <GameFilterChip :label="game?.title ?? null" @click="pickerOpen = true" />
        <template v-if="game && dex && game.dexes.length > 1">
          <v-divider vertical class="home-filters__divider" />
          <DexChips :dexes="game.dexes" :selected="dex.slug" @select="setDex" />
        </template>
        <template v-if="game">
          <v-divider vertical class="home-filters__divider" />
          <CaughtFilterChips
            :selected="caughtFilter"
            :caught-count="caughtCount"
            :missing-count="missingCount"
            @select="setCaughtFilter"
          />
        </template>
      </div>
    </template>

    <v-row v-if="sourceLoading" density="compact">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <PokemonCardSkeleton />
      </v-col>
    </v-row>

    <EmptyState
      v-else-if="sourceError"
      variant="error"
      title="Não foi possível carregar a Pokédex"
      :message="sourceError"
      action-label="Tentar novamente"
      @action="retry"
    />

    <EmptyState v-else-if="isEmpty" :title="emptyTitle" :message="emptyMessage" />

    <PokemonGrid
      v-else
      :key="listKey"
      :items="items"
      :status="status"
      :error-message="errorMessage"
      :caught-ids="game ? caughtIds : undefined"
      @load="loadMore"
      @retry="retry"
      @select="openPokemon"
      @toggle-caught="toggleCaught"
    />

    <GamePickerSheet
      v-model="pickerOpen"
      :games="games"
      :selected="game?.slug ?? null"
      @select="setGame"
    />
  </DefaultLayout>
</template>

<style scoped>
/* A linha de chips rola na horizontal em telas estreitas, sem quebrar o cabeçalho. */
.home-filters {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.home-filters::-webkit-scrollbar {
  display: none;
}

.home-filters__divider {
  height: 24px;
  align-self: center;
  opacity: 0.4;
}
</style>
