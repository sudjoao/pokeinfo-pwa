<script setup lang="ts">
import { computed } from 'vue'
import { mdiCheckCircle, mdiStarFourPoints } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import type { PokemonListItem } from '@/types/pokemon'
import { formatDexNumber, formatPokemonName, TYPE_COLORS } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import CatchToggle from '@/components/atoms/CatchToggle.vue'

const props = defineProps<{
  pokemon: PokemonListItem
  /** Estado de captura no jogo selecionado; undefined esconde o botão (Pokédex Nacional). */
  caught?: boolean
  /** Card escolhido (ex.: já está no time); undefined quando a lista não tem seleção. */
  selected?: boolean
  /**
   * Destino do card: vira um link de verdade (abre em nova aba, cmd/ctrl+clique). Sem ele, o card
   * é um botão de alternância (team builder, com `selected` como estado).
   */
  to?: RouteLocationRaw
}>()

const emit = defineEmits<{
  select: [pokemon: PokemonListItem]
  toggleCaught: [speciesId: number]
}>()

const { t } = useI18n()

const name = computed(() => formatPokemonName(props.pokemon.name))
const accent = computed(() => TYPE_COLORS[props.pokemon.types[0] ?? 'unknown'])

/** Com um jogo selecionado, o número regional vai em destaque e o nacional fica pequeno. */
const regional = computed(() => props.pokemon.dexNumber !== undefined)
const nationalLabel = computed(() => formatDexNumber(props.pokemon.speciesId ?? props.pokemon.id))
const speciesId = computed(() => props.pokemon.speciesId ?? props.pokemon.id)

/**
 * O link navega sozinho; o `select` avisa a view para tocar o grito ainda dentro do gesto (iOS).
 * Clique com modificador abre em outra aba/janela: aí não há grito nem navegação nesta tela.
 */
function onLinkClick(event: MouseEvent): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  emit('select', props.pokemon)
}
</script>

<template>
  <!-- `link` só dá o visual de clicável; o clique e o foco ficam no link/botão do nome (stretched). -->
  <v-card
    class="pokemon-card stretched-host"
    :class="{ 'pokemon-card--selected': selected }"
    :style="{ '--accent': accent }"
    :data-pokemon-id="pokemon.id"
    hover
    link
  >
    <div class="pokemon-card__art pa-2">
      <PokemonArtwork :id="pokemon.id" alt="" :size="120" />
      <v-icon v-if="selected" :icon="mdiCheckCircle" color="primary" class="pokemon-card__check" />
      <CatchToggle
        v-if="caught !== undefined"
        :caught="caught"
        :name="name"
        class="pokemon-card__catch"
        @toggle="emit('toggleCaught', speciesId)"
      />
    </div>
    <v-card-item class="pt-2">
      <div class="d-flex align-baseline flex-wrap ga-1">
        <DexNumber v-if="regional" :id="pokemon.dexNumber!" :digits="3" />
        <DexNumber v-else :id="pokemon.id" />
        <span v-if="regional" class="pokemon-card__national text-label-small">
          {{ t('common.national') }} {{ nationalLabel }}
        </span>
      </div>
      <span v-if="pokemon.sortLabel" class="pokemon-card__sort text-label-small">
        {{ pokemon.sortLabel }}
      </span>
      <v-card-title class="text-title-medium pa-0">
        <RouterLink v-if="to" :to="to" class="stretched-action" @click="onLinkClick">
          {{ name }}
        </RouterLink>
        <button
          v-else
          type="button"
          class="stretched-action"
          :aria-pressed="selected ?? false"
          @click="emit('select', pokemon)"
        >
          {{ name }}
        </button>
      </v-card-title>
      <span
        v-if="pokemon.exclusiveTo"
        class="pokemon-card__exclusive text-label-small d-inline-flex align-center ga-1"
        :aria-label="t('home.exclusivesOf', { version: pokemon.exclusiveTo })"
      >
        <v-icon :icon="mdiStarFourPoints" size="12" />
        {{ t('home.onlyIn', { version: pokemon.exclusiveTo }) }}
      </span>
    </v-card-item>
    <v-card-text class="d-flex flex-wrap ga-1 pt-0">
      <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pokemon-card {
  height: 100%;
  overflow: hidden;
}

.pokemon-card__art {
  position: relative;
  background: color-mix(in srgb, var(--accent) 22%, rgb(var(--v-theme-surface)));
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.pokemon-card__catch {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 4px;
}

.pokemon-card--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.pokemon-card__check {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgb(var(--v-theme-surface));
  border-radius: 50%;
}

.pokemon-card__sort {
  display: block;
  color: rgb(var(--v-theme-secondary));
  font-weight: 600;
}

.pokemon-card__national {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.pokemon-card__exclusive {
  color: rgb(var(--v-theme-secondary));
  font-weight: 600;
}
</style>
