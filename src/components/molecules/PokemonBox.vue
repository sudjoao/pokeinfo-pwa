<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiCheckCircle } from '@mdi/js'
import type { PokemonIndexEntry } from '@/types/pokemon'
import { formatDexNumber } from '@/utils/pokemon'
import { pokemonLabel } from '@/utils/megas'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

/** Uma entrada da Pokédex atual (já filtrada), com o número regional quando há jogo. */
export interface BoxEntry extends PokemonIndexEntry {
  dexNumber?: number
  speciesId?: number
}

/**
 * Uma caixa de 30 (ver PokemonBoxes). É um componente por caixa de propósito: marcar uma célula
 * re-renderiza só esta caixa, não as ~44 da Nacional (o Vue rastreia `caughtIds.has` por render).
 */
const props = defineProps<{
  box: readonly BoxEntry[]
  index: number
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

function speciesOf(entry: BoxEntry): number {
  return entry.speciesId ?? entry.id
}

function isCaught(entry: BoxEntry): boolean {
  return props.caughtIds?.has(speciesOf(entry)) ?? false
}

function numberOf(entry: BoxEntry): string {
  return entry.dexNumber !== undefined
    ? formatDexNumber(entry.dexNumber, 3)
    : formatDexNumber(speciesOf(entry))
}

const range = computed(
  () => `${numberOf(props.box[0]!)}–${numberOf(props.box[props.box.length - 1]!)}`,
)
const caughtCount = computed(() => props.box.filter(isCaught).length)

function isSelected(entry: BoxEntry): boolean {
  return props.selectedIds?.has(entry.id) ?? false
}

const boxSelected = computed(() => props.box.every(isSelected))

function toggleBox(): void {
  emit(
    'selectMany',
    props.box.map((entry) => entry.id),
    !boxSelected.value,
  )
}

/** Estado anunciado pelo botão da célula: seleção no modo de seleção, captura fora dele. */
function pressedOf(entry: BoxEntry): boolean | undefined {
  if (props.selecting) return isSelected(entry)
  return props.caughtIds ? isCaught(entry) : undefined
}

function labelOf(entry: BoxEntry): string {
  const label = `${numberOf(entry)} ${pokemonLabel(entry.id, entry.name)}`
  // Selecionando, o aria-pressed fala da seleção: a captura vai no nome.
  return props.selecting && isCaught(entry) ? `${label} (${t('catch.caught')})` : label
}

function onCell(entry: BoxEntry, event: MouseEvent): void {
  if (props.selecting) {
    emit('select', entry.id)
    return
  }
  if (!props.caughtIds) {
    emit('open', entry.id)
    return
  }
  // Marcar dá um "pop" na célula, como a Poké Bola do card; desmarcar só troca o fundo.
  if (!isCaught(entry) && !prefersReducedMotion()) {
    ;(event.currentTarget as HTMLElement).animate(
      [{ transform: 'scale(0.85)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'ease-out' },
    )
  }
  emit('toggleCaught', speciesOf(entry))
}
</script>

<template>
  <section class="pokemon-box" :aria-labelledby="`box-title-${index}`">
    <h2 :id="`box-title-${index}`" class="pokemon-box__title text-title-small">
      {{ t('boxes.box', { n: index + 1 }) }}
      <span class="text-label-medium opacity-70">{{ range }}</span>
      <span v-if="caughtIds" class="text-label-medium opacity-70 ms-auto">
        <span aria-hidden="true">{{
          t('boxes.caught', { caught: caughtCount, total: box.length })
        }}</span>
        <span class="d-sr-only">{{
          t('boxes.caughtLong', { caught: caughtCount, total: box.length })
        }}</span>
      </span>
    </h2>
    <v-btn
      v-if="selecting"
      size="small"
      variant="text"
      class="pokemon-box__select"
      :aria-pressed="boxSelected"
      :aria-label="
        boxSelected
          ? t('select.deselectBoxLong', { n: index + 1 })
          : t('select.selectBoxLong', { n: index + 1 })
      "
      @click="toggleBox"
    >
      {{ boxSelected ? t('select.deselectBox') : t('select.selectBox') }}
    </v-btn>
    <ul class="pokemon-box__grid">
      <li v-for="entry in box" :key="entry.id">
        <button
          type="button"
          class="pokemon-box__cell"
          :data-pokemon-id="entry.id"
          :class="{
            'pokemon-box__cell--missing': caughtIds && !isCaught(entry),
            'pokemon-box__cell--selected': selecting && isSelected(entry),
          }"
          :aria-pressed="pressedOf(entry)"
          :aria-label="labelOf(entry)"
          :title="labelOf(entry)"
          @click="onCell(entry, $event)"
        >
          <v-icon
            v-if="selecting && isSelected(entry)"
            :icon="mdiCheckCircle"
            size="16"
            color="primary"
            class="pokemon-box__check"
          />
          <PokemonAvatar
            :id="entry.id"
            :name="entry.name"
            :size="44"
            :shiny="shiny"
            decorative
            class="pokemon-box__avatar"
          />
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pokemon-box {
  /*
   * Até ~40 caixas (1.300 botões com imagem) de uma vez: as que estão fora da tela não são
   * diagramadas nem pintadas até chegarem perto. O tamanho reservado evita a barra de rolagem pular.
   */
  content-visibility: auto;
  contain-intrinsic-size: auto 340px;
  padding: 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pokemon-box__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 8px;
}

.pokemon-box__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pokemon-box__cell {
  position: relative;
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
  transition: background 0.15s ease;
}

.pokemon-box__cell:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

/*
 * Falta capturar: sem cor e sem fundo; o estado também vai no aria-pressed. O filtro fica só na
 * imagem (não no botão inteiro): centenas de botões filtrados pesam na pintura.
 */
.pokemon-box__cell--missing {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 5%, transparent);
}

.pokemon-box__cell--missing .pokemon-box__avatar {
  filter: grayscale(1);
  opacity: 0.55;
}

/* Selecionada: contorno grosso + ✓ (a cor sozinha não basta para indicar o estado). */
.pokemon-box__cell--selected {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: -3px;
}

.pokemon-box__check {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
}

.pokemon-box__select {
  margin: -4px 0 4px -8px;
}

.pokemon-box__avatar {
  background: none !important;
}
</style>
