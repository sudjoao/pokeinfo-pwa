<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { PokemonListItem } from '@/types/pokemon'
import PokemonCard from '@/components/molecules/PokemonCard.vue'

/**
 * Um bloco de cards da grade (ver PokemonGrid). Componente próprio porque o ESLint não aceita
 * `v-memo` dentro de `v-for` aninhado, e o v-memo é o que evita refazer os vnodes de centenas de
 * células quando um card muda.
 */
const props = defineProps<{
  items: readonly PokemonListItem[]
  caughtIds?: ReadonlySet<number>
  selectedIds?: ReadonlySet<number>
  selectable?: boolean
  wide?: boolean
  linkTo?: (pokemon: PokemonListItem) => RouteLocationRaw
  shiny?: boolean
  /** Quantos cards do início baixam a imagem já, com prioridade (só o primeiro bloco). */
  priorityCount?: number
}>()

const emit = defineEmits<{
  select: [pokemon: PokemonListItem]
  toggleCaught: [speciesId: number]
}>()

function caughtOf(pokemon: PokemonListItem): boolean | undefined {
  return props.caughtIds?.has(pokemon.speciesId ?? pokemon.id)
}
</script>

<template>
  <div
    v-for="(pokemon, index) in items"
    :key="pokemon.id"
    v-memo="[
      pokemon,
      caughtOf(pokemon),
      selectedIds?.has(pokemon.id),
      selectable,
      wide,
      linkTo,
      shiny,
      index,
    ]"
    class="pokemon-grid__cell"
  >
    <PokemonCard
      :pokemon="pokemon"
      :caught="caughtOf(pokemon)"
      :selected="selectedIds?.has(pokemon.id)"
      :selectable="selectable"
      :link-to="linkTo"
      :shiny="shiny"
      :priority="index < (priorityCount ?? 0)"
      @select="emit('select', $event)"
      @toggle-caught="emit('toggleCaught', $event)"
    />
  </div>
</template>
