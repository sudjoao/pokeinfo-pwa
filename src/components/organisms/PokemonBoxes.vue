<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonIndexEntry } from '@/types/pokemon'
import { formatDexNumber, formatPokemonName } from '@/utils/pokemon'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

/** Uma entrada da Pokédex atual (já filtrada), com o número regional quando há jogo. */
export interface BoxEntry extends PokemonIndexEntry {
  dexNumber?: number
  speciesId?: number
}

const props = defineProps<{
  items: readonly BoxEntry[]
  /** Espécies capturadas no jogo; undefined = sem jogo (tocar abre o detalhe). */
  caughtIds?: ReadonlySet<number>
}>()

const emit = defineEmits<{ toggleCaught: [speciesId: number]; open: [id: number] }>()

const { t } = useI18n()

/** Tamanho de uma caixa do Pokémon HOME e dos jogos atuais (6 colunas × 5 linhas). */
const BOX_SIZE = 30

const boxes = computed(() => {
  const result: BoxEntry[][] = []
  for (let i = 0; i < props.items.length; i += BOX_SIZE) {
    result.push(props.items.slice(i, i + BOX_SIZE))
  }
  return result
})

function speciesOf(entry: BoxEntry): number {
  return entry.speciesId ?? entry.id
}

function isCaught(entry: BoxEntry): boolean {
  return props.caughtIds?.has(speciesOf(entry)) ?? false
}

function numberOf(entry: BoxEntry): string {
  return entry.dexNumber !== undefined
    ? formatDexNumber(entry.dexNumber, 3)
    : formatDexNumber(entry.id)
}

function rangeOf(box: readonly BoxEntry[]): string {
  return `${numberOf(box[0]!)}–${numberOf(box[box.length - 1]!)}`
}

function onCell(entry: BoxEntry): void {
  if (props.caughtIds) emit('toggleCaught', speciesOf(entry))
  else emit('open', entry.id)
}
</script>

<template>
  <div class="pokemon-boxes">
    <section
      v-for="(box, index) in boxes"
      :key="index"
      class="pokemon-boxes__box"
      :aria-labelledby="`box-title-${index}`"
    >
      <h2 :id="`box-title-${index}`" class="pokemon-boxes__title text-title-small">
        {{ t('boxes.box', { n: index + 1 }) }}
        <span class="text-label-medium opacity-70">{{ rangeOf(box) }}</span>
        <span v-if="caughtIds" class="text-label-medium opacity-70 ms-auto">
          <span aria-hidden="true">{{
            t('boxes.caught', { caught: box.filter(isCaught).length, total: box.length })
          }}</span>
          <span class="d-sr-only">{{
            t('boxes.caughtLong', { caught: box.filter(isCaught).length, total: box.length })
          }}</span>
        </span>
      </h2>
      <ul class="pokemon-boxes__grid">
        <li v-for="entry in box" :key="entry.id">
          <button
            type="button"
            class="pokemon-boxes__cell"
            :class="{ 'pokemon-boxes__cell--missing': caughtIds && !isCaught(entry) }"
            :aria-pressed="caughtIds ? isCaught(entry) : undefined"
            :aria-label="`${numberOf(entry)} ${formatPokemonName(entry.name)}`"
            :title="`${numberOf(entry)} ${formatPokemonName(entry.name)}`"
            @click="onCell(entry)"
          >
            <PokemonAvatar
              :id="entry.id"
              :name="entry.name"
              :size="44"
              class="pokemon-boxes__avatar"
            />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.pokemon-boxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pokemon-boxes__box {
  padding: 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pokemon-boxes__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 8px;
}

.pokemon-boxes__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pokemon-boxes__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 12%, transparent);
  cursor: pointer;
  transition:
    background 0.15s ease,
    filter 0.15s ease;
}

.pokemon-boxes__cell:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

/* Falta capturar: sem cor e sem fundo; o estado também vai no aria-pressed. */
.pokemon-boxes__cell--missing {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 5%, transparent);
  filter: grayscale(1);
  opacity: 0.55;
}

.pokemon-boxes__avatar {
  background: none !important;
}
</style>
