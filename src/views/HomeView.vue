<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import type { PokemonSummary } from '@/types/pokemon'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import GameFilterChip from '@/components/molecules/GameFilterChip.vue'
import DexChips from '@/components/molecules/DexChips.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'

const {
  query,
  games,
  game,
  dex,
  setGame,
  setDex,
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

const emptyMessage = computed(() =>
  game.value && dex.value
    ? `Nenhum Pokémon com esse nome ou número na Pokédex de ${dex.value.label} (${game.value.title}).`
    : 'Tente buscar por outro nome ou número da Pokédex.',
)

/** O grito toca aqui, dentro do toque, porque o iOS bloqueia áudio fora de um gesto do usuário. */
function openPokemon(pokemon: PokemonSummary): void {
  cry.play(pokemon.id)
  router.push({ name: 'pokemon', params: { id: pokemon.id } })
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

    <EmptyState v-else-if="isEmpty" title="Nenhum Pokémon encontrado" :message="emptyMessage" />

    <PokemonGrid
      v-else
      :key="listKey"
      :items="items"
      :status="status"
      :error-message="errorMessage"
      @load="loadMore"
      @retry="retry"
      @select="openPokemon"
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
