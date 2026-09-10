<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiRefresh } from '@mdi/js'
import type { PokemonListItem } from '@/types/pokemon'
import PokemonCard from '@/components/molecules/PokemonCard.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'

export type GridStatus = 'idle' | 'loading' | 'error' | 'done'

const props = defineProps<{
  items: PokemonListItem[]
  status: GridStatus
  errorMessage?: string | null
  skeletonCount?: number
}>()

const emit = defineEmits<{
  load: []
  retry: []
  select: [pokemon: PokemonListItem]
}>()

const sentinelVisible = ref(false)

// Dispara o carregamento sempre que o sentinela estiver visível e a lista estiver ociosa.
// Cobre tanto o scroll do usuário quanto o caso em que o lote carregado não preencheu a tela.
watch(
  [sentinelVisible, () => props.status],
  ([visible, status]) => {
    if (visible && status === 'idle') emit('load')
  },
  { immediate: true },
)

function onIntersect(isIntersecting: boolean) {
  sentinelVisible.value = isIntersecting
}

// Começa a carregar o próximo lote ~1,5 telas antes do fim da lista.
const intersectOptions = { rootMargin: '0px 0px 1200px 0px' }
</script>

<template>
  <div class="pokemon-grid">
    <v-row density="compact">
      <v-col v-for="pokemon in items" :key="pokemon.id" cols="6" sm="4" md="3" lg="2">
        <PokemonCard :pokemon="pokemon" @select="emit('select', $event)" />
      </v-col>
    </v-row>

    <div
      v-intersect="{ handler: onIntersect, options: intersectOptions }"
      class="pokemon-grid__sentinel"
      aria-hidden="true"
    />

    <v-row v-if="status === 'loading'" density="compact" class="mt-1">
      <v-col v-for="n in skeletonCount ?? 6" :key="n" cols="6" sm="4" md="3" lg="2">
        <PokemonCardSkeleton />
      </v-col>
    </v-row>

    <div v-else-if="status === 'error'" class="text-center py-6">
      <p class="text-body-medium mb-3">{{ errorMessage ?? 'Erro ao carregar Pokémon' }}</p>
      <v-btn color="primary" variant="tonal" :prepend-icon="mdiRefresh" @click="emit('retry')">
        Tentar novamente
      </v-btn>
    </div>

    <p
      v-else-if="status === 'done' && items.length"
      class="text-center text-body-medium py-6 opacity-60"
    >
      Você chegou ao fim da lista.
    </p>
  </div>
</template>

<style scoped>
.pokemon-grid__sentinel {
  height: 1px;
}
</style>
