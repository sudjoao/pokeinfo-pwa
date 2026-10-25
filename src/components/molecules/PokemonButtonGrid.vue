<script setup lang="ts">
import { formatPokemonName } from '@/utils/pokemon'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

export interface PokemonButtonItem {
  id: number
  name: string
  /** Texto pequeno ao lado do nome (ex.: "oculta"). */
  note?: string
}

defineProps<{ items: readonly PokemonButtonItem[] }>()

const emit = defineEmits<{ select: [id: number] }>()
</script>

<template>
  <ul class="pokemon-button-grid">
    <li v-for="item in items" :key="item.id">
      <button
        type="button"
        class="pokemon-button-grid__item text-body-medium"
        @click="emit('select', item.id)"
      >
        <PokemonAvatar :id="item.id" :name="item.name" :size="36" decorative />
        <span class="text-truncate">{{ formatPokemonName(item.name) }}</span>
        <span v-if="item.note" class="text-label-small opacity-70">{{ item.note }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.pokemon-button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pokemon-button-grid__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 4px 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

@media (hover: hover) {
  .pokemon-button-grid__item:hover {
    background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 6%, transparent);
  }
}

.pokemon-button-grid__item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}
</style>
