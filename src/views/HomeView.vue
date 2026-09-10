<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import type { PokemonSummary } from '@/types/pokemon'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'

const {
  query,
  items,
  listKey,
  status,
  errorMessage,
  isEmpty,
  indexLoading,
  indexError,
  loadMore,
  retry,
} = usePokemonList()

const router = useRouter()
const cry = useCry()

/** O grito toca aqui, dentro do toque, porque o iOS bloqueia áudio fora de um gesto do usuário. */
function openPokemon(pokemon: PokemonSummary): void {
  cry.play(pokemon.id)
  router.push({ name: 'pokemon', params: { id: pokemon.id } })
}
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SearchField v-model="query" />
    </template>

    <v-row v-if="indexLoading" density="compact">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <PokemonCardSkeleton />
      </v-col>
    </v-row>

    <EmptyState
      v-else-if="indexError"
      variant="error"
      title="Não foi possível carregar a Pokédex"
      :message="indexError"
      action-label="Tentar novamente"
      @action="retry"
    />

    <EmptyState
      v-else-if="isEmpty"
      title="Nenhum Pokémon encontrado"
      message="Tente buscar por outro nome ou número da Pokédex."
    />

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
  </DefaultLayout>
</template>
