<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PokemonBox, { type BoxEntry } from '@/components/molecules/PokemonBox.vue'

export type { BoxEntry }

const props = defineProps<{
  items: readonly BoxEntry[]
  /** Espécies capturadas no jogo; undefined = sem jogo (tocar abre o detalhe). */
  caughtIds?: ReadonlySet<number>
  /** Modo de seleção múltipla: tocar seleciona (ids da forma), em vez de marcar a captura. */
  selecting?: boolean
  selectedIds?: ReadonlySet<number>
  /** Mostra os artworks shiny. */
  shiny?: boolean
}>()

const emit = defineEmits<{
  toggleCaught: [speciesId: number]
  open: [id: number]
  select: [id: number]
  /** "Selecionar caixa": todos os da caixa entram (ou saem, se já estavam todos). */
  selectMany: [ids: number[], selected: boolean]
}>()

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
</script>

<template>
  <!-- Com jogo, as caixas são a lista de marcação (como no Pokémon HOME): a dica diz o que o toque faz. -->
  <p v-if="!selecting && caughtIds" class="text-body-small mb-3">{{ t('boxes.hint') }}</p>
  <div class="pokemon-boxes">
    <PokemonBox
      v-for="(box, index) in boxes"
      :key="index"
      :box="box"
      :index="index"
      :caught-ids="caughtIds"
      :selecting="selecting"
      :selected-ids="selectedIds"
      :shiny="shiny"
      @toggle-caught="emit('toggleCaught', $event)"
      @open="emit('open', $event)"
      @select="emit('select', $event)"
      @select-many="(ids, selected) => emit('selectMany', ids, selected)"
    />
  </div>
</template>

<style scoped>
.pokemon-boxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>
