<script setup lang="ts">
import { usePokemonList } from '@/composables/usePokemonList'
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
    />
  </DefaultLayout>
</template>
